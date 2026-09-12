import { useCallback, useEffect, useRef, useState } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { useCamera } from '../../context/CameraContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import CameraErrorPanel from '../common/CameraErrorPanel'
import { extractFields, mergeExtractedFields } from './fieldExtractor'
import ManualCorrectionForm from './ManualCorrectionForm'
import { useOCR } from './useOCR'

function toCitizenRecord(fields) {
  return {
    documentType: fields.documentType || null,
    name: fields.name?.value || '',
    dateOfBirth: fields.dateOfBirth?.value || '',
    idNumber: fields.idNumber?.value || '',
    address: fields.address?.value || '',
  }
}

function emptyFields() {
  return {
    documentType: null,
    name: { value: '', confidence: 0 },
    dateOfBirth: { value: '', confidence: 0 },
    idNumber: { value: '', confidence: 0 },
    address: { value: '', confidence: 0 },
  }
}

function hasAnyExtractedField(fields) {
  return Boolean(
    fields?.name?.value?.trim() ||
    fields?.idNumber?.value?.trim() ||
    fields?.dateOfBirth?.value?.trim() ||
    fields?.address?.value?.trim()
  )
}

/**
 * Calculates extraction completeness score (0 to 100%) and checks whether
 * the document is ready to proceed.
 * If Name and Date of Birth (DOB) are correctly extracted, we can proceed automatically
 * to the next step (ID Number and Address can be manually filled or confirmed on next screen).
 */
function evaluateScanQuality(fields) {
  if (!fields || !fields.documentType || fields.documentType.id === 'unknown') {
    return { score: 10, isComplete: false, missingFields: ['Document Type'] }
  }

  const hasName = Boolean(fields.name?.value?.trim())
  const hasDob = Boolean(fields.dateOfBirth?.value?.trim())
  const hasId = Boolean(fields.idNumber?.value?.trim())
  const hasAddr = Boolean(fields.address?.value?.trim())

  const missing = []
  if (!hasName) missing.push('Full Name')
  if (!hasDob) missing.push('Date of Birth')
  if (!hasId) missing.push(fields.documentType.idLabel || 'ID Number')

  let score = 20
  if (hasName) score += 40
  if (hasDob) score += 40
  if (hasId) score = Math.min(100, score + 10)
  if (hasAddr) score = 100

  // User rule: If Name and DOB are extracted correctly, proceed automatically
  const isComplete = hasName && hasDob
  return { score: isComplete ? 100 : score, isComplete, missingFields: missing }
}

function DocumentScanner() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const autoAdvanceTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  const { updateCitizenData } = useCitizen()
  const { navigateTo, goHome } = useNavigation()
  const { stream, errorInfo, startCamera, stopCamera, retryCamera, shouldOfferButtonFallback } = useCamera()
  const { recognize, isReading, error: ocrError } = useOCR()

  const [draftFields, setDraftFields] = useState(null)
  const [showCorrection, setShowCorrection] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(null)
  const [isCountdownPaused, setIsCountdownPaused] = useState(false)
  const [buttonNavigation, setButtonNavigation] = useState(false)
  const [status, setStatus] = useState('Position your identity document inside the frame and hold steady.')
  const [scanPassCount, setScanPassCount] = useState(0)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return undefined
    video.srcObject = stream
    video.play().catch((err) => console.warn('[camera]', err.name, err.message))
    return undefined
  }, [stream])

  // Clear countdown intervals on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  const commitFields = useCallback((fields) => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    updateCitizenData(toCitizenRecord(fields))
    setShowCorrection(false)
    navigateTo('confirm', null, 'Document details verified. Please confirm them.')
  }, [navigateTo, updateCitizenData])

  const startAutoAdvanceCountdown = useCallback((fields) => {
    setCountdownSeconds(5)
    setIsCountdownPaused(false)

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    autoAdvanceTimerRef.current = setTimeout(() => {
      commitFields(fields)
    }, 5200)
  }, [commitFields])

  const pauseCountdown = useCallback(() => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setIsCountdownPaused(true)
    setCountdownSeconds(null)
  }, [])

  const runOcrOnImage = useCallback(async (image, isManualCapture = false) => {
    if (isVerified) return
    setStatus('Reading document carefully… Hold card steady in good light.')

    const result = await recognize(image)
    if (result.error) {
      setStatus(result.error)
      if (isManualCapture) {
        setDraftFields(emptyFields())
        setShowCorrection(true)
      }
      return
    }

    const nextFields = extractFields(result.text, result.words)

    if (!hasAnyExtractedField(nextFields) && !draftFields) {
      setStatus('No clear document text detected yet. Keep card flat inside frame with good lighting.')
      if (isManualCapture) {
        setDraftFields(emptyFields())
        setShowCorrection(true)
      }
      return
    }

    setScanPassCount((prev) => prev + 1)

    // Accumulate and progressively refine details across frames
    const merged = draftFields ? mergeExtractedFields(draftFields, nextFields) : nextFields
    setDraftFields(merged)

    const quality = evaluateScanQuality(merged)
    const docName = merged.documentType?.name || 'Document'

    // Check if the document has complete, verified information
    if (quality.isComplete) {
      setIsVerified(true)
      setStatus(`✅ ${docName} successfully scanned & verified! All required details extracted.`)
      startAutoAdvanceCountdown(merged)
      return
    }

    // If incomplete:
    if (isManualCapture) {
      // On manual capture, open correction form pre-filled with whatever was captured
      setStatus('Reviewing captured details…')
      setShowCorrection(true)
    } else {
      // On automatic scanning: guide user to hold steady for missing fields
      if (quality.missingFields.length > 0) {
        setStatus(`Detected ${docName}. Hold steady to scan: ${quality.missingFields.join(', ')}…`)
      } else {
        setStatus(`Scanning ${docName}… Hold steady to refine details.`)
      }
    }
  }, [draftFields, isVerified, recognize, startAutoAdvanceCountdown])

  const captureFrame = useCallback(async (isManualCapture = false) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      setStatus('Camera starting… Position document inside the frame.')
      return
    }
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    await runOcrOnImage(canvas, isManualCapture)
  }, [runOcrOnImage])

  // Deliberate auto-scan timer: gives user 3.5s to align before first scan, scans every 3.5s
  useEffect(() => {
    if (!stream || showCorrection || isVerified) return undefined

    const scanAutomatically = () => {
      if (!isReading && !isVerified) captureFrame(false)
    }

    const timer = window.setInterval(scanAutomatically, 3500)
    const firstScan = window.setTimeout(scanAutomatically, 3500)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(firstScan)
    }
  }, [captureFrame, isReading, isVerified, showCorrection, stream])

  const onUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const image = await createImageBitmap(file)
    const canvas = canvasRef.current
    canvas.width = image.width
    canvas.height = image.height
    canvas.getContext('2d').drawImage(image, 0, 0)
    await runOcrOnImage(canvas, true)
  }

  const updateDraftField = (key, value) => {
    setDraftFields((previous) => ({
      ...previous,
      [key]: { ...previous[key], value, confidence: 100 },
    }))
  }

  const restartScan = () => {
    pauseCountdown()
    setIsVerified(false)
    setDraftFields(null)
    setScanPassCount(0)
    setStatus('Position your identity document inside the frame and hold steady.')
  }

  usePrimaryAction(
    showCorrection
      ? () => draftFields && commitFields(draftFields)
      : isVerified
      ? () => draftFields && commitFields(draftFields)
      : () => captureFrame(true)
  )

  const hasAnyDetectedField = draftFields && hasAnyExtractedField(draftFields)
  const quality = evaluateScanQuality(draftFields)

  return (
    <section className="workspace-panel scanner-panel">
      <span className="eyebrow">Step 1 of 3 · Document scan</span>
      <h2>Scan an identity document</h2>
      <p className="lead">
        Supports PAN Card, Voter ID (EPIC), Driving Licence, and Aadhaar Card. Takes time to scan and verify proper details.
      </p>

      {!isVerified && (
        <div className={`scan-frame ${errorInfo ? 'placeholder' : ''}`}>
          {errorInfo && !stream ? (
            <>
              <span>Camera unavailable</span>
              <small>{errorInfo.userMessage}</small>
            </>
          ) : (
            <video ref={videoRef} playsInline muted autoPlay aria-label="Document camera preview" />
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden-canvas" />

      <CameraErrorPanel
        errorInfo={errorInfo}
        onRetry={retryCamera}
        onFallback={() => {
          stopCamera()
          setButtonNavigation(true)
          setStatus('Button navigation is on. Enter your details manually to continue.')
        }}
        showFallbackAction={shouldOfferButtonFallback}
      />

      {/* VERIFIED SUMMARY STATE: Shows extracted details cleanly without rushing */}
      {isVerified && draftFields && !showCorrection && (
        <div className="scanner-verified-panel" aria-live="polite">
          <div className="scanner-verified-header">
            <div className="scanner-badge-group">
              <span className="scanner-success-badge">✅ Scan Complete & Verified</span>
              <span className="scanner-doc-badge">
                {draftFields.documentType?.icon || '🪪'} {draftFields.documentType?.name || 'Identity Document'}
              </span>
            </div>
            {countdownSeconds !== null && countdownSeconds > 0 && !isCountdownPaused && (
              <div className="scanner-countdown-tag">
                <span>Advancing in {countdownSeconds}s</span>
                <button type="button" className="scanner-pause-btn" onClick={pauseCountdown}>
                  Pause
                </button>
              </div>
            )}
          </div>

          <div className="scanner-verified-card">
            <div className="scanner-field-row">
              <span className="field-title">Full Name:</span>
              <strong className="field-value">
                {draftFields.name?.value ? `✓ ${draftFields.name.value}` : '—'}
              </strong>
            </div>

            <div className="scanner-field-row">
              <span className="field-title">{draftFields.documentType?.idLabel || 'ID Number'}:</span>
              <strong className="field-value">
                {draftFields.idNumber?.value ? `✓ ${draftFields.idNumber.value}` : 'Can be filled manually on next screen'}
              </strong>
            </div>

            <div className="scanner-field-row">
              <span className="field-title">Date of Birth / Age:</span>
              <strong className="field-value">
                {draftFields.dateOfBirth?.value ? `✓ ${draftFields.dateOfBirth.value}` : '—'}
              </strong>
            </div>

            <div className="scanner-field-row">
              <span className="field-title">Address:</span>
              <strong className="field-value">
                {draftFields.documentType?.id === 'pan'
                  ? 'Not on standard PAN card (Not required)'
                  : draftFields.address?.value
                  ? `✓ ${draftFields.address.value}`
                  : 'Can be filled manually on next screen'}
              </strong>
            </div>
          </div>

          <div className="action-row" style={{ marginTop: '18px' }}>
            <button
              className="primary-button"
              type="button"
              onClick={() => commitFields(draftFields)}
            >
              Proceed with verified details →
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setShowCorrection(true)}
            >
              Edit details
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={restartScan}
            >
              Rescan document
            </button>
          </div>
          <p className="field-hint" style={{ marginTop: '10px', color: '#087f77', fontWeight: 500 }}>
            🗣️ Talk to navigate: Say “Find schemes” or “Proceed” to see your matching welfare schemes.
          </p>
        </div>
      )}

      {/* LIVE SCANNING PROGRESS & CHIPS (when not yet verified) */}
      {!isVerified && hasAnyDetectedField && !showCorrection && (
        <div className="scanner-live-preview" aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#075d5a' }}>
              <span>{draftFields.documentType?.icon || '🪪'}</span>
              <span>{draftFields.documentType?.name || 'Document Identified'}</span>
            </strong>
            <span style={{ fontSize: '12px', color: '#087f77', fontWeight: 600 }}>
              Scan Progress: {quality.score}% · Pass {scanPassCount}
            </span>
          </div>

          <div className="scanner-detected-chips">
            <span className={`scanner-chip ${draftFields.name?.value ? '' : 'missing'}`}>
              {draftFields.name?.value ? `✓ Name: ${draftFields.name.value}` : '○ Scanning for Name…'}
            </span>
            <span className={`scanner-chip ${draftFields.idNumber?.value ? '' : 'missing'}`}>
              {draftFields.idNumber?.value ? `✓ ID: ${draftFields.idNumber.value}` : '○ Scanning for ID Number…'}
            </span>
            <span className={`scanner-chip ${draftFields.dateOfBirth?.value ? '' : 'missing'}`}>
              {draftFields.dateOfBirth?.value ? `✓ DOB: ${draftFields.dateOfBirth.value}` : '○ Scanning for DOB…'}
            </span>
            {draftFields.documentType?.hasAddress && (
              <span className={`scanner-chip ${draftFields.address?.value ? '' : 'missing'}`}>
                {draftFields.address?.value ? `✓ Address Found` : '○ Address (Can fill manually)'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* MANUAL CORRECTION FORM */}
      {showCorrection && draftFields && (
        <ManualCorrectionForm
          fields={draftFields}
          onChange={updateDraftField}
          onConfirm={() => commitFields(draftFields)}
          onCancel={() => {
            setShowCorrection(false)
            setStatus('Position your identity document inside the frame and hold steady.')
          }}
        />
      )}

      {/* DEFAULT SCANNER CONTROLS (when not in correction form or verified screen) */}
      {!showCorrection && !isVerified && (
        <>
          <p className="scan-status">{isReading ? 'Reading document carefully… Hold steady.' : status}</p>
          {ocrError && <p className="error-banner">{ocrError}</p>}
          <div className="action-row">
            <button
              className="primary-button"
              type="button"
              onClick={() => captureFrame(true)}
              disabled={isReading || !stream}
            >
              {isReading ? 'Reading…' : 'Capture document'}
            </button>
            <label className="secondary-button upload-button">
              Upload photo
              <input type="file" accept="image/*" onChange={onUpload} hidden />
            </label>
            {hasAnyDetectedField && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowCorrection(true)}
              >
                Review captured details
              </button>
            )}
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setDraftFields(emptyFields())
                setShowCorrection(true)
              }}
            >
              Enter details manually
            </button>
            {buttonNavigation && (
              <span className="scan-status">Use the buttons below to continue without camera access.</span>
            )}
            <button className="secondary-button" type="button" onClick={goHome}>
              Back
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default DocumentScanner

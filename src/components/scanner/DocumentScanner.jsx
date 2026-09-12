import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

function evaluateScanQuality(fields) {
  if (!fields) {
    return { score: 10, isComplete: false, missingFields: ['Document Type'] }
  }

  const hasName = Boolean(fields.name?.value?.trim())
  const hasDob = Boolean(fields.dateOfBirth?.value?.trim())
  const hasId = Boolean(fields.idNumber?.value?.trim())
  const hasAddr = Boolean(fields.address?.value?.trim())

  const missing = []
  if (!hasName) missing.push('Full Name')
  if (!hasDob) missing.push('Date of Birth')
  if (!hasId) missing.push(fields.documentType?.idLabel || 'ID Number')

  let score = 20
  if (hasName) score += 40
  if (hasDob) score += 40
  if (hasId) score = Math.min(100, score + 10)
  if (hasAddr) score = 100

  const isComplete = hasName && hasDob && hasId
  if (!fields.documentType || fields.documentType.id === 'unknown') missing.push('Document Type')

  return { score: isComplete ? 100 : score, isComplete, missingFields: missing }
}

function DocumentScanner() {
  const { t } = useTranslation(['scanner', 'common'])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const autoAdvanceTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const isVerifiedRef = useRef(false)
  const hasCommittedRef = useRef(false)
  const draftFieldsRef = useRef(null)

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
  const [status, setStatus] = useState(t('scanner:status.initial', 'Position your identity document inside the frame and hold steady.'))
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

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  const commitFields = useCallback((fields) => {
    if (!fields || hasCommittedRef.current) return
    hasCommittedRef.current = true
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
    if (isVerifiedRef.current) return
    setStatus(t('scanner:status.reading', 'Reading document carefully… Hold card steady in good light.'))

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

    const previousFields = draftFieldsRef.current
    if (!hasAnyExtractedField(nextFields) && !previousFields) {
      setStatus(t('scanner:status.noText', 'No clear document text detected yet. Keep card flat inside frame with good lighting.'))
      if (isManualCapture) {
        setDraftFields(emptyFields())
        setShowCorrection(true)
      }
      return
    }

    setScanPassCount((prev) => prev + 1)

    const merged = previousFields ? mergeExtractedFields(previousFields, nextFields) : nextFields
    draftFieldsRef.current = merged
    setDraftFields(merged)

    const quality = evaluateScanQuality(merged)
    const docName = merged.documentType?.name || 'Document'

    if (quality.isComplete) {
      isVerifiedRef.current = true
      setIsVerified(true)
      setStatus(
        t('scanner:status.verified', '✅ {{docName}} successfully scanned & verified! All required details extracted.', {
          docName,
        }),
      )
      startAutoAdvanceCountdown(merged)
      return
    }

    if (isManualCapture) {
      setStatus(t('scanner:status.reviewing', 'Reviewing captured details…'))
      setShowCorrection(true)
    } else {
      if (quality.missingFields.length > 0) {
        setStatus(
          t('scanner:status.holdSteadyMissing', 'Detected {{docName}}. Hold steady to scan: {{missing}}…', {
            docName,
            missing: quality.missingFields.join(', '),
          }),
        )
      } else {
        setStatus(
          t('scanner:status.holdSteadyRefine', 'Scanning {{docName}}… Hold steady to refine details.', {
            docName,
          }),
        )
      }
    }
  }, [draftFields, isVerified, recognize, startAutoAdvanceCountdown, t])

  const captureFrame = useCallback(async (isManualCapture = false) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      setStatus(t('scanner:status.cameraStarting', 'Camera starting… Position document inside the frame.'))
      return
    }
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    await runOcrOnImage(canvas, isManualCapture)
  }, [runOcrOnImage, t])

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
    const input = event.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    stopCamera()
    pauseCountdown()
    isVerifiedRef.current = false
    hasCommittedRef.current = false
    draftFieldsRef.current = null
    setIsVerified(false)
    setDraftFields(null)
    setScanPassCount(0)
    setStatus(t('scanner:status.uploading', 'Processing uploaded document photo…'))

    try {
      let image = null
      try {
        if (typeof createImageBitmap === 'function') {
          image = await createImageBitmap(file, { imageOrientation: 'from-image' })
        }
      } catch (bitmapErr) {
        console.warn('[upload bitmap fallback]', bitmapErr)
      }

      if (!image) {
        image = await new Promise((resolve, reject) => {
          const img = new Image()
          const url = URL.createObjectURL(file)
          img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
          }
          img.onerror = (err) => {
            URL.revokeObjectURL(url)
            reject(err)
          }
          img.src = url
        })
      }

      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = image.width || 1280
        canvas.height = image.height || 720
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        image.close?.()
        await runOcrOnImage(canvas, true)
      }
    } catch (uploadError) {
      console.error('[document upload]', uploadError)
      setStatus(t('scanner:status.uploadError', 'That photo could not be read. Please choose another image.'))
    }
  }

  const updateDraftField = (key, value) => {
    setDraftFields((previous) => ({
      ...previous,
      [key]: { ...previous[key], value, confidence: 100 },
    }))
  }

  const restartScan = () => {
    pauseCountdown()
    isVerifiedRef.current = false
    hasCommittedRef.current = false
    draftFieldsRef.current = null
    setIsVerified(false)
    setDraftFields(null)
    setScanPassCount(0)
    setStatus(t('scanner:status.initial', 'Position your identity document inside the frame and hold steady.'))
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
      <span className="eyebrow">{t('scanner:eyebrow', 'Step 1 of 3 · Document scan')}</span>
      <h2>{t('scanner:title', 'Scan an identity document')}</h2>
      <p className="lead">
        {t(
          'scanner:lead',
          'Supports PAN Card, Voter ID (EPIC), Driving Licence, and Aadhaar Card. Takes time to scan and verify proper details.',
        )}
      </p>

      {!isVerified && (
        <div className={`scan-frame ${errorInfo ? 'placeholder' : ''}`}>
          {errorInfo && !stream ? (
            <>
              <span>{t('scanner:cameraUnavailable', 'Camera unavailable')}</span>
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
          setStatus(t('scanner:status.buttonNavOn', 'Button navigation is on. Enter your details manually to continue.'))
        }}
        showFallbackAction={shouldOfferButtonFallback}
      />

      {/* VERIFIED SUMMARY STATE */}
      {isVerified && draftFields && !showCorrection && (
        <div className="scanner-verified-panel" aria-live="polite">
          <div className="scanner-verified-header">
            <div className="scanner-badge-group">
              <span className="scanner-success-badge">
                {t('scanner:verifiedPanel.scanComplete', '✅ Scan Complete & Verified')}
              </span>
              <span className="scanner-doc-badge">
                {draftFields.documentType?.icon || '🪪'} {draftFields.documentType?.name || 'Identity Document'}
              </span>
            </div>
            {countdownSeconds !== null && countdownSeconds > 0 && !isCountdownPaused && (
              <div className="scanner-countdown-tag">
                <span>
                  {t('scanner:verifiedPanel.advancingIn', 'Advancing in {{count}}s', {
                    count: countdownSeconds,
                  })}
                </span>
                <button type="button" className="scanner-pause-btn" onClick={pauseCountdown}>
                  {t('scanner:verifiedPanel.pause', 'Pause')}
                </button>
              </div>
            )}
          </div>

          <div className="scanner-verified-card">
            <div className="scanner-field-row">
              <span className="field-title">{t('scanner:verifiedPanel.fullName', 'Full Name:')}</span>
              <strong className="field-value">
                {draftFields.name?.value ? `✓ ${draftFields.name.value}` : '—'}
              </strong>
            </div>

            <div className="scanner-field-row">
              <span className="field-title">
                {draftFields.documentType?.idLabel || t('scanner:verifiedPanel.idNumber', 'ID Number:')}:
              </span>
              <strong className="field-value">
                {draftFields.idNumber?.value
                  ? `✓ ${draftFields.idNumber.value}`
                  : t('scanner:verifiedPanel.manualFillNotice', 'Can be filled manually on next screen')}
              </strong>
            </div>

            <div className="scanner-field-row">
              <span className="field-title">{t('scanner:verifiedPanel.dob', 'Date of Birth / Age:')}</span>
              <strong className="field-value">
                {draftFields.dateOfBirth?.value ? `✓ ${draftFields.dateOfBirth.value}` : '—'}
              </strong>
            </div>

            <div className="scanner-field-row">
              <span className="field-title">{t('scanner:verifiedPanel.address', 'Address:')}</span>
              <strong className="field-value">
                {draftFields.documentType?.id === 'pan'
                  ? t('scanner:verifiedPanel.panNoAddress', 'Not on standard PAN card (Not required)')
                  : draftFields.address?.value
                  ? `✓ ${draftFields.address.value}`
                  : t('scanner:verifiedPanel.manualFillNotice', 'Can be filled manually on next screen')}
              </strong>
            </div>
          </div>

          <div className="action-row" style={{ marginTop: '18px' }}>
            <button
              className="primary-button"
              type="button"
              onClick={() => commitFields(draftFields)}
            >
              {t('scanner:verifiedPanel.proceedBtn', 'Proceed with verified details →')}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setShowCorrection(true)}
            >
              {t('scanner:verifiedPanel.editBtn', 'Edit details')}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={restartScan}
            >
              {t('scanner:verifiedPanel.rescanBtn', 'Rescan document')}
            </button>
          </div>
          <p className="field-hint" style={{ marginTop: '10px', color: '#087f77', fontWeight: 500 }}>
            {t(
              'scanner:verifiedPanel.voiceHint',
              '🗣️ Talk to navigate: Say “Find schemes” or “Proceed” to see your matching welfare schemes.',
            )}
          </p>
        </div>
      )}

      {/* LIVE SCANNING PROGRESS & CHIPS */}
      {!isVerified && hasAnyDetectedField && !showCorrection && (
        <div className="scanner-live-preview" aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#075d5a' }}>
              <span>{draftFields.documentType?.icon || '🪪'}</span>
              <span>{draftFields.documentType?.name || 'Document Identified'}</span>
            </strong>
            <span style={{ fontSize: '12px', color: '#087f77', fontWeight: 600 }}>
              {t('scanner:chips.progress', 'Scan Progress: {{score}}% · Pass {{pass}}', {
                score: quality.score,
                pass: scanPassCount,
              })}
            </span>
          </div>

          <div className="scanner-detected-chips">
            <span className={`scanner-chip ${draftFields.name?.value ? '' : 'missing'}`}>
              {draftFields.name?.value
                ? t('scanner:chips.nameFound', '✓ Name: {{value}}', { value: draftFields.name.value })
                : t('scanner:chips.nameScanning', '○ Scanning for Name…')}
            </span>
            <span className={`scanner-chip ${draftFields.idNumber?.value ? '' : 'missing'}`}>
              {draftFields.idNumber?.value
                ? t('scanner:chips.idFound', '✓ ID: {{value}}', { value: draftFields.idNumber.value })
                : t('scanner:chips.idScanning', '○ Scanning for ID Number…')}
            </span>
            <span className={`scanner-chip ${draftFields.dateOfBirth?.value ? '' : 'missing'}`}>
              {draftFields.dateOfBirth?.value
                ? t('scanner:chips.dobFound', '✓ DOB: {{value}}', { value: draftFields.dateOfBirth.value })
                : t('scanner:chips.dobScanning', '○ Scanning for DOB…')}
            </span>
            {draftFields.documentType?.hasAddress && (
              <span className={`scanner-chip ${draftFields.address?.value ? '' : 'missing'}`}>
                {draftFields.address?.value
                  ? t('scanner:chips.addressFound', '✓ Address Found')
                  : t('scanner:chips.addressScanning', '○ Address (Can fill manually)')}
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
            setStatus(t('scanner:status.initial', 'Position your identity document inside the frame and hold steady.'))
          }}
        />
      )}

      {/* DEFAULT SCANNER CONTROLS */}
      {!showCorrection && !isVerified && (
        <>
          <p className="scan-status">
            {isReading
              ? t('scanner:status.reading', 'Reading document carefully… Hold steady.')
              : status}
          </p>
          {ocrError && <p className="error-banner">{ocrError}</p>}
          <div className="action-row">
            <button
              className="primary-button"
              type="button"
              onClick={() => captureFrame(true)}
              disabled={isReading || !stream}
            >
              {isReading
                ? t('scanner:buttons.reading', 'Reading…')
                : t('scanner:buttons.capture', 'Capture document')}
            </button>
            <label className="secondary-button upload-button">
              {t('scanner:buttons.upload', 'Upload photo')}
              <input type="file" accept="image/*" onChange={onUpload} hidden />
            </label>
            {hasAnyDetectedField && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowCorrection(true)}
              >
                {t('scanner:buttons.reviewCaptured', 'Review captured details')}
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
              {t('scanner:buttons.enterManual', 'Enter details manually')}
            </button>
            {buttonNavigation && (
              <span className="scan-status">
                {t('scanner:buttonNavPrompt', 'Use the buttons below to continue without camera access.')}
              </span>
            )}
            <button className="secondary-button" type="button" onClick={goHome}>
              {t('scanner:buttons.back', 'Back')}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default DocumentScanner

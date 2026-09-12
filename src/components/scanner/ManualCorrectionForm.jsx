import { OCR_FIELD_CONFIDENCE_THRESHOLD } from '../../constants'

const FIELDS = [
  ['name', 'Full name'],
  ['dateOfBirth', 'Date of birth'],
  ['idNumber', 'ID number'],
  ['address', 'Address'],
]

function ManualCorrectionForm({ fields, onChange, onConfirm, onCancel }) {
  const isPan = fields.documentType?.id === 'pan'

  return (
    <div className="correction-form">
      <p className="lead">
        Please verify the extracted information. Edit any field below to correct it, then confirm to continue.
      </p>
      {isPan && (
        <div className="info-banner" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: '#eef6f5', color: '#075d5a', fontSize: '0.9rem' }}>
          ℹ️ Standard PAN cards do not display an address. Address is marked as not applicable.
        </div>
      )}
      <div className="field-grid">
        {FIELDS.map(([key, label]) => {
          const isAddressOnPan = key === 'address' && isPan
          return (
            <label key={key}>
              {label}
              {isAddressOnPan ? (
                <small className="field-hint">Not present on PAN Card</small>
              ) : (
                <small>Confidence {Math.round(fields[key]?.confidence || 0)}%</small>
              )}
              <input
                value={fields[key]?.value || ''}
                placeholder={isAddressOnPan ? 'Not applicable for PAN card' : ''}
                disabled={isAddressOnPan}
                onChange={(event) => onChange(key, event.target.value)}
              />
            </label>
          )
        })}
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={onConfirm}>Confirm details</button>
        <button className="secondary-button" type="button" onClick={onCancel}>Retake</button>
      </div>
    </div>
  )
}

export default ManualCorrectionForm

import { OCR_FIELD_CONFIDENCE_THRESHOLD } from '../../constants'

const FIELDS = [
  ['name', 'Full name'],
  ['dateOfBirth', 'Date of birth'],
  ['idNumber', 'ID number'],
  ['address', 'Address'],
]

function ManualCorrectionForm({ fields, onChange, onConfirm, onCancel }) {
  return (
    <div className="correction-form">
      <p className="lead">
        At least one field is below {OCR_FIELD_CONFIDENCE_THRESHOLD}% confidence. Please correct anything that looks wrong, then confirm before we save it on this device.
      </p>
      <div className="field-grid">
        {FIELDS.map(([key, label]) => (
          <label key={key}>
            {label}
            <small>Confidence {Math.round(fields[key]?.confidence || 0)}%</small>
            <input
              value={fields[key]?.value || ''}
              onChange={(event) => onChange(key, event.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={onConfirm}>Confirm details</button>
        <button className="secondary-button" type="button" onClick={onCancel}>Retake</button>
      </div>
    </div>
  )
}

export default ManualCorrectionForm

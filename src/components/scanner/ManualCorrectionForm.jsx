import { useTranslation } from 'react-i18next'
import { OCR_FIELD_CONFIDENCE_THRESHOLD } from '../../constants'

function ManualCorrectionForm({ fields, onChange, onConfirm, onCancel }) {
  const { t } = useTranslation('scanner')
  const isPan = fields.documentType?.id === 'pan'

  const fieldLabels = {
    name: t('confirmScreen.fullName', 'Full name'),
    dateOfBirth: t('confirmScreen.dob', 'Date of birth'),
    idNumber: fields.documentType?.idLabel || t('confirmScreen.idNumber', 'ID number'),
    address: t('confirmScreen.address', 'Address'),
  }

  const fieldKeys = ['name', 'dateOfBirth', 'idNumber', 'address']

  return (
    <div className="correction-form">
      <p className="lead">
        {t(
          'correction.lead',
          'Please verify the extracted information. Edit any field below to correct it, then confirm to continue.',
        )}
      </p>
      {isPan && (
        <div
          className="info-banner"
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#eef6f5',
            color: '#075d5a',
            fontSize: '0.9rem',
          }}
        >
          {t(
            'correction.panBanner',
            'ℹ️ Standard PAN cards do not display an address. Address is marked as not applicable.',
          )}
        </div>
      )}
      <div className="field-grid">
        {fieldKeys.map((key) => {
          const isAddressOnPan = key === 'address' && isPan
          const label = fieldLabels[key]
          return (
            <label key={key}>
              {label}
              {isAddressOnPan ? (
                <small className="field-hint">{t('correction.notOnPan', 'Not present on PAN Card')}</small>
              ) : (
                <small>
                  {t('correction.confidence', 'Confidence {{conf}}%', {
                    conf: Math.round(fields[key]?.confidence || 0),
                  })}
                </small>
              )}
              <input
                value={fields[key]?.value || ''}
                placeholder={isAddressOnPan ? t('correction.notApplicablePan', 'Not applicable for PAN card') : ''}
                disabled={isAddressOnPan}
                onChange={(event) => onChange(key, event.target.value)}
              />
            </label>
          )
        })}
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={onConfirm}>
          {t('correction.confirm', 'Confirm details')}
        </button>
        <button className="secondary-button" type="button" onClick={onCancel}>
          {t('correction.retake', 'Retake')}
        </button>
      </div>
    </div>
  )
}

export default ManualCorrectionForm

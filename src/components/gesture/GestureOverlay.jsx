function GestureOverlay({ landmarks, gesture, videoWidth, videoHeight }) {
  return (
    <svg className="gesture-overlay" viewBox={`0 0 ${videoWidth || 640} ${videoHeight || 480}`} aria-hidden="true">
      {landmarks.map((point, index) => (
        <circle
          key={index}
          cx={point.x * (videoWidth || 640)}
          cy={point.y * (videoHeight || 480)}
          r="6"
        />
      ))}
      <text x="16" y="32" className="gesture-label">
        {gesture ? gesture.replace('_', ' ') : 'No pose yet'}
      </text>
    </svg>
  )
}

export default GestureOverlay

const MapLayersItem = ({ label, description, iconClassName }) => {
  return (
    <div className="map-legend-item" title={description}>
      <div className={`map-legend-icon ${iconClassName}`}></div>
      <label>{label}</label>
    </div>
  );
};
export default MapLayersItem;

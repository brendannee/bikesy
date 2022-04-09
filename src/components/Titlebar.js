import appConfig from 'appConfig';

const TitleBar = ({ mobileView, changeMobileView }) => {
  const getRightButton = () => {
    if (mobileView === 'map') {
      return (
        <button
          className="btn btn-white btn-sm btn-right d-print-none pt-0"
          onClick={() => changeMobileView('directions')}
        >
          Directions
        </button>
      );
    }

    if (mobileView === 'directions') {
      return (
        <button
          className="btn btn-white btn-sm btn-right d-print-none pt-0"
          onClick={() => changeMobileView('map')}
        >
          Map
        </button>
      );
    }

    return null;
  };

  return (
    <div className="titlebar">
      <h1 className="site-title">
        <a href={appConfig.ABOUT_LINK_URL}>
          <img
            src={`/images/${appConfig.LOGO_FILENAME_ROOT}.png`}
            srcSet={`/images/${appConfig.LOGO_FILENAME_ROOT}@2x.png 2x`}
            alt="logo"
            className="logo"
          />
        </a>
      </h1>
      {getRightButton()}
    </div>
  );
};

export default TitleBar;

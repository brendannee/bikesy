const React = require('react');
const classNames = require('classnames');

class Disclaimer extends React.Component {

  render() {
    return (
      <div className={classNames('disclaimer', this.props.classes)}>
        We offer no guarantee regarding roadway conditions or safety of the proposed routes. Use your best judgment when choosing a route. Obey all vehicle code provisions.
      </div>
    );
  }
}

Disclaimer.propTypes = {
  classes: React.PropTypes.object,
};

module.exports = Disclaimer;

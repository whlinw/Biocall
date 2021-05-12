import React from 'react';

class Jitsi extends React.Component {
  constructor(props) {
    super();
    this.props = props;
  }

  componentDidMount() {
    const jitsiDomain = 'meet.jit.si';
    const jitsiOptions = {
      roomName: 'Biocall_' + this.props.room,
      parentNode: document.querySelector('#jitsi-container'),
    };

    const api = new JitsiMeetExternalAPI(jitsiDomain, jitsiOptions);
    api.addListener('readyToClose', this.props.callback);
  }

  render() {
    return (
      <div className="JitsiContainer" id="jitsi-container" />
    );
  }
}

export default Jitsi;

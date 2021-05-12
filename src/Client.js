import React from 'react';

import StressLevelChart from './StressLevelChart';
import Jitsi from './Jitsi';

class Client extends React.Component {
  constructor() {
    super();
    this.state = {
      room: '',
    };
    this.date = new Date();
    this.handleClick = this.handleClick.bind(this);
    this.endCall = this.endCall.bind(this);
    this.setBiocallServer = this.setBiocallServer.bind(this);
  }

  componentDidMount() {
    this.props.oscSetup();
  }

  handleClick(event) {
    event.preventDefault();
    if (this.state.room) {
      this.props.setup(this.state.room);
    }
  }

  setBiocallServer(e) {
    e.preventDefault();
    this.props.setBiocallServer(e.target.value);
  }

  endCall() {
    this.props.cleanup();
  }

  render() {
    const visibleBorder = this.props.appstate.showClient_border
      ? this.props.appstate.borderStyle
      : { boxShadow: 'none' };
    const visibleStressChart = this.props.appstate.showClient_stress
      ? ''
      : ' hide-el';
    const shovedStressChart = this.props.appstate.ui_shovedStressChart
      ? 'chart-wrap stress-level-chart-wrap'
      : 'chart-wrap stress-level-chart-wrap chart-hidden';
    const shovedStressChartContain = this.props.appstate.ui_shovedStressChart
      ? 'chart-contain stress-level-chart-contain'
      : 'chart-contain stress-level-chart-contain chart-contain-hidden';

    return this.props.appstate.inCall ? (
      <div className="JitsiContainer">
        <div className="jitsi-window">
          <div style={visibleBorder} className="jitsi-wrap">
            <div className="JitsiContainer">
              <Jitsi room={this.state.room} callback={this.endCall} />
            </div>
          </div>

          <div className="charts-contain">
            <div className={shovedStressChartContain + visibleStressChart}>
              <div className={shovedStressChart}>
                <StressLevelChart
                  bioData={this.props.appstate.displayData_gsr}
                  time={this.props.appstate.lastUpdateTime}
                />
                <div
                  className="chart-toggle-button"
                  onClick={this.props.toggleShovedStressChart}
                >
                  Stress level
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="connection-preparation">
        <h1>Start a BioCall</h1>
        <div>
          <p id="connect-status" />
          <form className="room-input-wrap">
            <div className="room-input">
              <input
                id="server"
                type="text"
                placeholder="Biocall server"
                hidden={this.props.appstate.production}
                value={this.props.appstate.biocallServer}
                onChange={this.setBiocallServer}
              />
              <input
                id="room"
                type="text"
                placeholder="Enter a room name"
                onChange={(e) => this.setState({room: e.target.value})}
              />
            </div>
            <button className="room-join-btn" onClick={this.handleClick} type='submit'>
              Start
            </button>
          </form>
        </div>
        <div>
          <div className="datasource">
            <div className="gsr-title-wrap">
              <h2>eSense "/GSR"</h2>
              <p>
                Listening for OSC data on port <span>4559</span>
              </p>
            </div>
            <div className="gsr-value-box">
              <div className="gsr-value-title">Latest GSR value:</div>
              <div id="gsr-value" className="gsr-value">
                -
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default Client;

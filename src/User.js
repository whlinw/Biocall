import React from 'react';
import { remote } from 'electron';

import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Slider from '@material-ui/core/Slider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';

import StressLevelChart from './StressLevelChart';
import Jitsi from './Jitsi';
import Counter from './Counter';

class User extends React.Component {
  constructor() {
    super();
    this.state = {
      room: '',
      spoof: false,
      spoofInputPath: '',
      spoofInput: false,
      displaySpoofMenu: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleChangeToggleSpoofGSR = this.handleChangeToggleSpoofGSR.bind(this);
    this.handleChangeSpoofValue = this.handleChangeSpoofValue.bind(this);
    this.handleChangeToggleShowToClientBorder = this.handleChangeToggleShowToClientBorder.bind(this);
    this.handleChangeToggleShowToClientStress = this.handleChangeToggleShowToClientStress.bind(this);
    this.endCall = this.endCall.bind(this);
    this.setBiocallServer = this.setBiocallServer.bind(this);
    this.setSpoofMin = this.setSpoofMin.bind(this);
    this.setSpoofMax = this.setSpoofMax.bind(this);
    this.handleClickBrowse = this.handleClickBrowse.bind(this);
    this.handleClickStartSpoof = this.handleClickStartSpoof.bind(this);
    this.handleClickStopSpoof = this.handleClickStopSpoof.bind(this);
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

  setSpoofMin(val) {
    const min = this.props.appstate.displayData_gsr.min + val;
    if (min >= 0 && min < this.props.appstate.spoof_gsr.value) {
      this.props.setSpoofGSRMin(min);
    }
  }

  setSpoofMax(val) {
    const max = this.props.appstate.displayData_gsr.max + val;
    if (max >= 1 && max > this.props.appstate.spoof_gsr.value) {
      this.props.setSpoofGSRMax(max);
    }
  }

  handleChangeToggleSpoofGSR(event) {
    const bool = event.target.checked;
    this.props.toggleSpoofGSR(bool);
  }

  handleChangeSpoofValue(event, value) {
    this.props.setSpoofGSRValue(parseFloat(value));
  }

  handleChangeToggleShowToClientBorder() {
    this.props.toggleShowToClientBorder();
  }

  handleChangeToggleShowToClientStress() {
    this.props.toggleShowToClientStress();
  }

  async handleClickBrowse() {
    let path = await remote.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Input', extensions: ['csv'] }],
    });
    if (!path) {
      return;
    }
    path = path.filePaths[0];
    if (path) {
      this.setState({ spoofInputPath: path, spoofInput: true });
    }
  }

  handleClickStartSpoof() {
    this.props.processSpoofInput(this.state.spoofInputPath);
  }

  handleClickStopSpoof() {
    this.props.stopSpoofInput();
  }

  endCall() {
    this.props.cleanup();
  }

  componentDidMount() {
    if (this.props.appstate.role === 'research') {
      window.addEventListener('keydown', (event) => {
        if (event.ctrlKey && (event.key === 'Q' || event.key === 'q')) {
          this.setState((prevState) => ({
            displaySpoofMenu: !prevState.displaySpoofMenu,
          }));
        }
      });
    }
  }

  render() {
    const serverInput = this.props.appstate.develop
      ? ''
      : 'dev-server';
    const resizedWindow = this.props.appstate.ui_resizedWindow
      ? 'jitsi-wrap jitsi-resized'
      : 'jitsi-wrap';
    const shovedStressChart = this.props.appstate.ui_shovedStressChart
      ? 'chart-wrap stress-level-chart-wrap'
      : 'chart-wrap stress-level-chart-wrap chart-hidden';
    const shovedStressChartContain = this.props.appstate.ui_shovedStressChart
      ? 'chart-contain stress-level-chart-contain'
      : 'chart-contain stress-level-chart-contain chart-contain-hidden';
    const resizedWindowCharts = this.props.appstate.ui_resizedWindow
      ? 'charts-contain charts-side'
      : 'charts-contain';
    const displaySpoofMenu = this.state.displaySpoofMenu
      ? 'spoof-menu'
      : 'spoof-menu spoof-menu-hidden';
    const rangeMin = Math.ceil(this.props.appstate.displayData_gsr.min);
    const rangeMax = Math.ceil(this.props.appstate.displayData_gsr.max);

    const checkboxBorder = (
      <input
        type="checkbox"
        checked={this.props.appstate.showClient_border}
        onChange={this.handleChangeToggleShowToClientBorder}
      />
    );
    const checkboxStress = (
      <input
        type="checkbox"
        checked={this.props.appstate.showClient_stress}
        onChange={this.handleChangeToggleShowToClientStress}
      />
    );

    return this.props.appstate.inCall ? (
      <div className="main">
        <div className={displaySpoofMenu}>
          <div className="marker">
            <Button
              variant="contained"
              color="primary"
              disableElevation
              onClick={this.props.setMarker}
              disabled={this.props.appstate.marker}
            >
              Marker
            </Button>
          </div>
          <div className="spoof-toggle">
            <FormControlLabel
              control={
                <Switch
                  checked={this.props.appstate.spoof_gsr.on}
                  onChange={this.handleChangeToggleSpoofGSR}
                  disabled={this.props.appstate.getSpoofFromData}
                  color="primary"
                />
              }
              label="Enable spoof GSR"
            />
          </div>
          <div className="spoof-from-file">
            <div className="file-selector">
              <input
                className="file-selector-name"
                value={this.state.spoofInputPath}
                placeholder="Choose a CSV file ..."
                readOnly
              />
              <button
                className="file-selector-btn"
                onClick={this.handleClickBrowse}
              >
                Browse
              </button>
            </div>
            <div>
              <div className="start-spoof-from-file">
                <button
                  onClick={this.handleClickStartSpoof}
                  disabled={
                    !this.props.appstate.isSpoofed_gsr ||
                    !this.state.spoofInput ||
                    this.props.appstate.getSpoofFromData
                  }
                >
                  Start
                </button>
              </div>
              <div className="stop-spoof-from-file">
                <button
                  onClick={this.handleClickStopSpoof}
                  disabled={!this.props.appstate.getSpoofFromData}
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
          <div className="spoof-input-range">
            <div className="spoof-input-range-text">
              <span>Spoof range min</span>
            </div>
            <div className="spoof-input-range-buttons">
              <Counter handler={this.setSpoofMin} disabled={false} />
            </div>
            <div className="spoof-input-range-text">
              <span>Spoof range max</span>
            </div>
            <div className="spoof-input-range-buttons">
              <Counter handler={this.setSpoofMax} disabled={false} />
            </div>
          </div>
          <div className="spoof-from-input">
            <Slider
              defaultValue={0.5}
              aria-labelledby="discrete-slider-always"
              step={0.1}
              value={this.props.appstate.spoof_gsr.value}
              disabled={this.props.appstate.getSpoofFromData}
              min={rangeMin}
              max={rangeMax}
              marks={[
                { value: rangeMin - 0.01, label: rangeMin },
                { value: rangeMax + 0.01, label: rangeMax },
                { value: this.props.appstate.bioData_gsr, label: '⬆︎' },
              ]}
              valueLabelDisplay="auto"
              track={false}
              onChange={this.handleChangeSpoofValue}
            />
          </div>
        </div>
        <div className="jitsi-window">
          <div
            style={this.props.appstate.borderStyle}
            className={resizedWindow}
          >
            <Jitsi room={this.state.room} callback={this.endCall} />
            <div className="change-size-wrap">
              <span
                onClick={this.props.toggleWindowSize}
                className="change-size-btn"
              >
                <FontAwesomeIcon icon={faChevronUp} />
              </span>
            </div>
          </div>

          <div className={resizedWindowCharts}>
            <div className={shovedStressChartContain}>
              <div className={shovedStressChart}>
                <StressLevelChart
                  bioData={this.props.appstate.displayData_gsr}
                  time={this.props.appstate.lastUpdateTime}
                />
                <div
                  className="chart-toggle-button"
                  onClick={this.props.toggleShovedStressChart}
                > {/* [EDIT] Change chart tab name here. */}
                  Stress level 
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-wrap">
            <div className="bottom-wrap-part bottom-left">
              <div className="toggles-title">Show elements to client</div>
              <div className="toggles-wrap">
                <div className="toggles-text">
                  <label className="toggle-label">
                    {checkboxBorder}
                    <span className="toggle toggle-round" />
                  </label>
                  <span className="toggles-desc">Show border to client</span>
                </div>
                <div className="toggles-text">
                  <label className="toggle-label">
                    {checkboxStress}
                    <span className="toggle toggle-round" />
                  </label>
                  <span className="toggles-desc">
                    Show stress level to client
                  </span>
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
                className={serverInput}
                type="text"
                placeholder="Biocall server"
                value={this.props.appstate.biocallServer}
                onChange={this.setBiocallServer}
              />
              <input
                id="room"
                type="text"
                placeholder="Enter a room name"
                onChange={(e) => this.setState({ room: e.target.value })}
              />
            </div>
            <button
              className="room-join-btn"
              onClick={this.handleClick}
              type="submit"
            >
              Start
            </button>
          </form>
        </div>
      </div>
    );
  }
}

export default User;

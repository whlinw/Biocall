import React from 'react';
import { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import socketIOClient from 'socket.io-client';

import Home from './Home';
import User from './User';
import Client from './Client';

const osc = require('osc');
const fs = require('fs');
const path = require('path');
const OUTPUT_PATH = path.join(require('os').homedir(), 'Desktop', 'Biocall');

const console = require('console');

const OSC_HOST = '0.0.0.0';
const OSC_PORT = '4559';

class App extends Component {
  constructor() {
    super();
    this.state = {
      develop: true /* ALLOW SERVER INPUT. CHANGE TO FALSE FOR PRODUCTION */,
      role: 'guest' /* guest, client, pract, research */,
      room: 'default',
      sessionName: '',
      sessionTime: 0,
      biocallServer: 'http://127.0.0.1:4001' /* SERVER ADDRESS */,
      serverConnected: false,
      inCall: false,
      bioData_gsr: 0.0,
      spoofData_gsr: -1.0,
      displayData_gsr: {
        value: 0.0,
        min: 0.0,
        max: 1.0,
      },
      isSpoofed_gsr: false,
      getSpoofFromData: false,
      spoof_gsr: { on: false, value: 1 } /* Local spoof status */,
      borderStyle: { boxShadow: '0 0 40px 5px rgba(0, 0, 255, 0.75)' },
      borderColor: '#0000ff',
      showClient_border: false,
      showClient_stress: false,
      ui_resizedWindow: false,
      ui_shovedStressChart: false,
      ui_shovedHRChart: false,
      ui_displaySpoofMenu: false,
      userOpenChart: false,
      userOpenControl: false,
      lastUpdateTime: 0,
      numberOfPeople: 0,
      marker: false,
      dumpData: true,
      windowSize: 60,
    };

    /* Initialization */
    this.setRole = this.setRole.bind(this);
    this.userSetup = this.userSetup.bind(this);
    this.userCleanup = this.userCleanup.bind(this);
    this.oscServerStart = this.oscServerStart.bind(this);
    this.handleOSCMessage = this.handleOSCMessage.bind(this);
    this.setBiocallServer = this.setBiocallServer.bind(this);

    /* Feedback */
    this.initSettings = this.initSettings.bind(this);
    this.processBioData = this.processBioData.bind(this);
    this.processSpoofDataGSR = this.processSpoofDataGSR.bind(this);
    this.setDisplayData = this.setDisplayData.bind(this);
    this.setBorderStyle = this.setBorderStyle.bind(this);

    /* Spoof */
    this.toggleSpoofGSR = this.toggleSpoofGSR.bind(this);
    this.setSpoofGSRValue = this.setSpoofGSRValue.bind(this);
    this.processSpoofInput = this.processSpoofInput.bind(this);
    this.setSpoofGSRValueSequence = this.setSpoofGSRValueSequence.bind(this);
    this.stopSpoofInput = this.stopSpoofInput.bind(this);
    this.setSpoofGSRMax = this.setSpoofGSRMax.bind(this); /* update max to server */
    this.setGSRMax = this.setGSRMax.bind(this); /* set max from server */
    this.setSpoofGSRMin = this.setSpoofGSRMin.bind(this);
    this.setGSRMin = this.setGSRMin.bind(this);
    this.setMarker = this.setMarker.bind(this);

    /* Configure feedback */
    this.toggleShowToClientBorder = this.toggleShowToClientBorder.bind(this);
    this.toggleShowToClientStress = this.toggleShowToClientStress.bind(this);

    /* UI change */
    this.toggleShovedStressChart = this.toggleShovedStressChart.bind(this);
    this.toggleWindowSize = this.toggleWindowSize.bind(this);
  }

  /* Set the role of current user. */
  setRole(role) {
    this.setState({ role: role }, () => {
      console.log('Hello user:', this.state.role);
    });
  }

  /* Start the OSC server for receiving data from eSense. */
  oscServerStart() {
    this.oscPort = new osc.UDPPort({
      localAddress: OSC_HOST,
      localPort: OSC_PORT,
      metadata: true,
    });
    console.log('[Log] oscServer running on', OSC_HOST, 'listen to Port', OSC_PORT);
    this.oscPort.on('message', this.handleOSCMessage);
    this.oscPort.open();
  }

  /* Process the received OSC message. */
  handleOSCMessage(msg) {
    if (msg['address'] === '/GSR') {
      const biodata = msg['args'][0]['value'];
      if (document.getElementById('gsr-value') != null) {
        document.getElementById('gsr-value').innerHTML = biodata;
      }
      if (this.socket) {
        this.socket.emit('gsrData', biodata);
      }
    } else if (msg['address'] === '/test') { /* Testing for input from iOS using app Clean OSC. */
      const biodata = parseFloat(msg.args[0].value).toFixed(2); 
      if (document.getElementById('gsr-value') != null) {
        document.getElementById('gsr-value').innerHTML = biodata;
      }
      if (this.socket) {
        this.socket.emit('gsrData', biodata);
      }
    }
  }

  /* Set the biocall server address. */
  setBiocallServer(s) {
    this.setState({ biocallServer: s });
  }

  /* Connect to the Biocall server and initialize. */
  initialize(room) {
    this.setState({ room: room });

    /* Connect to server. */
    this.socket = socketIOClient(this.state.biocallServer);

    /* Once connected, Initialize stuff. */
    this.socket.on('connect', () => {
      this.setState({ serverConnected: true });
      this.setState({ inCall: true });
      console.log('[Log] Connect to ' + this.state.biocallServer);
      this.socket.emit('role', this.state.role);
      this.socket.emit('joinRoom', this.state.room);

      /* Set session start time. */
      const d = new Date();
      const h = (d.getHours() < 10 ? '0' : '') + d.getHours();
      const m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      const s = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
      this.setState((prevState) => ({
      	sessionName: prevState.room +
          '_' +
          prevState.role +
          '_' +
          d.getFullYear() +
          '-' +
          (d.getMonth() + 1) +
          '-' +
          d.getDate() +
          '-' +
          h +
          m +
          s,
        sessionTime: Math.round(Date.now() / 1000),
      }));

      /* Create output file. */
      if ((this.state.role === "research" || this.state.role === "pract") && this.state.dumpData) {
        if (!fs.existsSync(OUTPUT_PATH)) {
          fs.mkdir(OUTPUT_PATH, (err) => {
            if (err) throw err;
          });
        }
        fs.appendFile(path.join(OUTPUT_PATH, 'Biocall_'+this.state.sessionName+'.csv'), 'time,people,displayData,bioData,spoofData,isSpoofed,marker,showBorder,borderColor,showChart,userOpenControl,userOpenChart\n', function (err) {
            if (err) throw err;
          }
        );
      }
    });

    this.socket.on('message', (msg) => {
      console.log('[Log] Message:', msg);
    });

    this.socket.on('disconnect', () => {
      console.log('[Log] Disconnect from server.');
      this.setState({ serverConnected: false });
      this.setState({ inCall: false });
      this.socket.close();
    });

    this.socket.on('initRoom', (data) => this.initSettings(data));
    this.socket.on('bioData', (data) => this.processBioData(data));
    this.socket.on('spoofDataGSR', (data) => this.processSpoofDataGSR(data));
    this.socket.on('setSpoofGSR', (bool) => {
      this.setState({ isSpoofed_gsr: bool });
    });
    this.socket.on('setMinGSR', (data) => this.setGSRMin(data));
    this.socket.on('setMaxGSR', (data) => this.setGSRMax(data));
    this.socket.on('showToClientBorder', (bool) => {
      this.setState({ showClient_border: bool });
    });
    this.socket.on('showToClientStress', (bool) => {
      this.setState({ showClient_stress: bool });
    });
    this.socket.on('userOpenControl', (bool) => {
      this.setState({ userOpenControl: bool });
    });
    this.socket.on('userOpenChart', (bool) => {
      this.setState({ userOpenChart: bool });
    });
    this.socket.on('numConnections', (data) => {
      this.setState({ numberOfPeople: data });
    });
  }

  /* Called after user click join. */
  userSetup(room) {
    this.initialize(room);
  }

  /* Called after call ends. */
  userCleanup() {
    this.socket.emit('disconnect');
    this.socket.close();
    console.log('[Log] Disconnect from server.');
    this.resetStates();
  }

  /* Reset state after call ends. */
  resetStates() {
    this.setState({ serverConnected: false });
    this.setState({ inCall: false });
    this.setState({ bioData_gsr: {value:0.0, max:0.0} });
    this.setState({ displayData_gsr: {
      value: 0.0,
      min: 0.0,
      max: 1.0,
    } });
    this.setState({ spoofData_gsr: -1.0 });
    this.setState({ isSpoofed_gsr: false });
    this.setState({ getSpoofFromData: false });
    this.setState({ spoof_gsr: { on: false, value: 1 } });
    this.setState({ borderStyle: { boxShadow: '0 0 40px 5px rgba(0, 0, 255, 0.75)' } });
    this.setState({ borderColor: '#0000ff' });
    this.setState({ showClient_border: false });
    this.setState({ showClient_stress: false });
    this.setState({ userOpenChart: false });
    this.setState({ userOpenControl: false });
  }

  /* Update local spoof and feedback configs when joining a room. */
  initSettings(data) {
    this.setState({ isSpoofed_gsr: data.spoof['gsr'].on });
    this.setState({ spoofData_gsr: data.spoof['gsr'].value });
    if (data.spoof['gsr'].min > -1) {
      this.setState((prevState) => ({
        displayData_gsr: {
          value: prevState.displayData_gsr.value,
          min: data.spoof['gsr'].min,
          max: prevState.displayData_gsr.max,
        },
      }));
    }
    if (data.spoof['gsr'].max > -1) {
      this.setState((prevState) => ({
        displayData_gsr: {
          value: prevState.displayData_gsr.value,
          min: prevState.displayData_gsr.min,
          max: data.spoof['gsr'].max,
        },
      }));
    }
    this.setState({ showClient_border: data.showClient['Border'] });
    this.setState({ showClient_stress: data.showClient['Stress'] });
    this.setState({ userOpenControl: data.userOpen['Control'] });
    this.setState({ userOpenChart: data.userOpen['Chart'] });
  }

  /* Process Biodata received from the server. */
  processBioData(data) {
    const gsrData = parseFloat(data['gsr']);
    this.setState((prevState) => ({
      bioData_gsr: gsrData,
    }));
    this.setDisplayData(gsrData);
    this.setState({ lastUpdateTime: Math.round(Date.now() / 1000) });
    if ((this.state.role === "research" || this.state.role === "pract") && this.state.dumpData) {
      this.dumpData();
    }
  }

  /* Process the spoof value received from the server. */
  processSpoofDataGSR(data) {
    this.setState({ spoofData_gsr: parseFloat(data) });
  }

  /* Set the data to be displayed based on whether spoof function is on. */
  setDisplayData(gsrData) {
    let displayGSR = gsrData;
    if (this.state.isSpoofed_gsr && this.state.spoofData_gsr >= 0) {
      displayGSR = this.state.spoofData_gsr;
    }

    this.setState((prevState) => ({
      displayData_gsr: {
        value: displayGSR,
        min: Math.min(displayGSR, prevState.displayData_gsr.min),
        max: Math.max(displayGSR, prevState.displayData_gsr.max),
      },
    }));

    /* Set border color by the displayed GSR data. */
    this.setBorderStyle(this.state.displayData_gsr); 
  }

  /* [EDIT] Change algorithm & border color in the function setBorderStyle */
  /* Set border color given the data. */
  setBorderStyle(data) {
    /* Default R (redVal), G (greenVal), B (blueVal) values = 0 */
    let redVal = 0;
    let greenVal = 0;
    let blueVal = 0;

    /* Algorithm start. Decide how redVal, greenVal, blueVal are derived here. */
    let percOfMaxVal = data.value / data.max;
    redVal = Math.floor(255 * percOfMaxVal);
    blueVal = 255 - redVal;

    if (data.value <= 1) {
      redVal = 0;
      blueVal = 225;
    } else if (data.value >= data.max) {
      redVal = 225;
      blueVal = 0;
    }
    /* Algorithm end */

    /* Set color based on RGB values. */
    this.setState({
      borderStyle: {
        boxShadow: `0 0 50px 5px rgba(${redVal}, ${greenVal}, ${blueVal}, 0.75)`,
      },
    });
    this.setState({
      borderColor:
        '#' +
        redVal.toString(16).padStart(2, '0') +
        greenVal.toString(16).padStart(2, '0') +
        blueVal.toString(16).padStart(2, '0'),
    });
  }

  /* Export data to the output file. */
  dumpData() {
    const data =
      (Math.round(Date.now()/1000) - this.state.sessionTime) +
      ',' +
      this.state.numberOfPeople +
      ',' +
      this.state.displayData_gsr.value +
      ',' +
      this.state.bioData_gsr +
      ',' +
      this.state.spoofData_gsr +
      ',' +
      this.state.isSpoofed_gsr +
      ',' +
      Number(this.state.marker) +
      ',' +
      this.state.showClient_border +
      ',' +
      this.state.borderColor +
      ',' +
      this.state.showClient_stress +
      ',' +
      this.state.userOpenControl +
      ',' +
      this.state.userOpenChart +
      '\n';
    fs.appendFile(
      path.join(OUTPUT_PATH, 'Biocall_' + this.state.sessionName + '.csv'),
      data,
      (err) => {
        if (err) throw err;
      }
    );
    this.setState({ marker: false });
  }

  /* Set and tell server to turn on/off the spoof function. */
  toggleSpoofGSR(bool) {
    this.setState(
      (prevState) => ({
        spoof_gsr: { on: bool, value: prevState.spoof_gsr.value },
      }),
      () => {
        this.socket.emit('spoofGSR', bool);
      }
    );
  }

  /* Process the spoof values from a input file. */
  processSpoofInput(fpath) {
    this.setState({ getSpoofFromData: true }, () => {
      const data = fs.readFileSync(fpath, 'utf8').toString().split(',');
      this.setSpoofGSRValueSequence(data);
    });
  }

  /* Set and send to server a spoof value. */
  setSpoofGSRValue(value) {
    this.setState(
      (prevState) => ({
        spoof_gsr: { on: prevState.spoof_gsr.on, value: value },
      }),
      () => {
        this.socket.emit('spoofValueGSR', value);
      }
    );
  }

  /* Set and send a sequence of spoof values. */
  setSpoofGSRValueSequence(seq) {
    if (this.state.getSpoofFromData) {
      const value = parseFloat(seq.shift());
      this.setSpoofGSRValue(value);
      if (seq.length > 0) {
        setTimeout(this.setSpoofGSRValueSequence, 1000, seq);
      } else {
        this.setState({ getSpoofFromData: false });
      }
    }
  }

  /* Stop sending the spoof value squence. */
  stopSpoofInput() {
    this.setState({ getSpoofFromData: false });
  }

  /* Tell server the manual setted minimum GSR value. */
  setSpoofGSRMin(value) {
    this.socket.emit('spoofMinGSR', value);
  }

  /* Set the local minumum GSR value. */
  setGSRMin(value) {
    this.setState((prevState) => ({
      displayData_gsr: {
        value: prevState.displayData_gsr.value,
        min: value,
        max: prevState.displayData_gsr.max,
      },
    }));
  }

  /* Tell server the manual setted maximum GSR value. */
  setSpoofGSRMax(value) {
    this.socket.emit('spoofMaxGSR', value);
  }

  /* Set the local maximum GSR value. */
  setGSRMax(value) {
    this.setState((prevState) => ({
      displayData_gsr: {
        value: prevState.displayData_gsr.value,
        min: prevState.displayData_gsr.min,
        max: value,
      },
    }));
  }

  /* Set marker. */
  setMarker() {
    this.setState({ marker: true });
  }

  /* Tell server to enable/disable client border. */
  toggleShowToClientBorder() {
    this.setState(
      (prevState) => ({ showClient_border: !prevState.showClient_border }),
      () => {
        this.socket.emit('showToClientBorder', this.state.showClient_border);
      }
    );
  }

  /* Tell server to enable/disable client GSR chart. */
  toggleShowToClientStress() {
    this.setState(
      (prevState) => ({ showClient_stress: !prevState.showClient_stress }),
      () => {
        this.socket.emit('showToClientStress', this.state.showClient_stress);
      }
    );
  }

  /* Open local chart. */
  toggleShovedStressChart() {
    this.setState(
      (prevState) => ({
        ui_shovedStressChart: !prevState.ui_shovedStressChart,
      }),
      () => {
        if (this.state.role === 'pract') {
          this.socket.emit('userOpenChart', this.state.ui_shovedStressChart);
        }
      }
    );
  }

  /* Open local control panel. */
  toggleWindowSize() {
    this.setState(
      (prevState) => ({ ui_resizedWindow: !prevState.ui_resizedWindow }),
      () => {
        if (this.state.role === 'pract') {
          this.socket.emit('userOpenControl', this.state.ui_resizedWindow);
        }
      }
    );
  }

  componentDidMount() {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.id = 'JitsiAPI';
    document.body.appendChild(script);
  }

  render() {
    return (
      <div className="main">
        <Switch>
          <Route
            path="/"
            exact
            render={() => <Home handler={this.setRole} />}
          />
          <Route
            path="/user"
            exact
            render={() => (
              <User
                appstate={this.state}
                setBiocallServer={this.setBiocallServer}
                setup={this.userSetup}
                cleanup={this.userCleanup}
                setMarker={this.setMarker}
                toggleSpoofGSR={this.toggleSpoofGSR}
                setSpoofGSRValue={this.setSpoofGSRValue}
                processSpoofInput={this.processSpoofInput}
                stopSpoofInput={this.stopSpoofInput}
                setSpoofGSRMin={this.setSpoofGSRMin}
                setSpoofGSRMax={this.setSpoofGSRMax}
                toggleShowToClientBorder={this.toggleShowToClientBorder}
                toggleShowToClientStress={this.toggleShowToClientStress}
                toggleWindowSize={this.toggleWindowSize}
                toggleShovedStressChart={this.toggleShovedStressChart}
              />
            )}
          />
          <Route
            path="/client"
            exact
            render={() => (
              <Client
                appstate={this.state}
                setBiocallServer={this.setBiocallServer}
                oscSetup={this.oscServerStart}
                setup={this.userSetup}
                cleanup={this.userCleanup}
                toggleShovedStressChart={this.toggleShovedStressChart}
              />
            )}
          />
          <Route path="" exact render={() => <Home handler={this.setRole} />} />
        </Switch>
      </div>
    );
  }
}

export default App;

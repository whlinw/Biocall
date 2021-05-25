# Biocall

The following software packages should be installed for developing Biocall app:
* [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Python](https://www.python.org/downloads/)
* [NodeJS & npm](https://nodejs.org/en/download/)
* [Yarn](https://classic.yarnpkg.com/en/docs/install/)
* [node-gyp](https://github.com/nodejs/node-gyp#installation): Depending on your operating system, you may need to install additional software and configure settings, e.g., Xcode or Visual C++ build tools. Please read through their installation instructions. 

### Installation
```bash
# Clone the app
git clone https://github.com/whlinw/Biocall
cd Biocall

# Install dependencies with yarn
yarn
```

### Starting development
```bash
# Start the app in the dev environment
yarn start
```

### Packaging for production
The packaged app will be in `Biocall/release/` by default.
```bash
# To package apps for the local platform
yarn package

# To package apps for specific platforms
# options: -w (Windows), -m (macOS), -wm (Windows & macOS)
yarn package -wm
```

### Important variables

Two variables in `Biocall/src/App.js` might need to be changed during development.

* `develop`: Set to false before packaging. The value indicates whether or not to show the server address input field in the join room user interface.  
* `biocallServer`: Set the value to the IP address and port of Biocall server.

```js
this.state = {
  develop: true /* ALLOW SERVER INPUT. CHANGE TO FALSE FOR PRODUCTION */,
  role: 'guest'
  room: 'default',
  sessionName: '',
  sessionTime: 0,
  biocallServer: 'http://127.0.0.1:4001' /* SERVER ADDRESS */,
  serverConnected: false,
  inCall: false,
  //...
}
```
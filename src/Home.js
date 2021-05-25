import React from 'react';
import { Link } from 'react-router-dom';

class Home extends React.Component {
  render() {
    return (
      <div className="home">
        <h1>Welcome to Biocall</h1>
        <div className="select-user">
          <h2>Choose a type of user:</h2>
          <div className="user-wrap">
            <div className="user">
              <Link to="/client" onClick={() => this.props.handler('client')}>
                <button className="user-btn">Client</button>
              </Link>
            </div>
            <div className="user">
              <Link to="/user" onClick={() => this.props.handler('pract')}>
                <button className="user-btn">Practitioner</button>
              </Link>
            </div>
            <div className="user">
              <Link to="/user" onClick={() => this.props.handler('research')}>
                <button className="user-btn">Researcher</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;

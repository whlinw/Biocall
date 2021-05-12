import React from 'react';

class Counter extends React.Component {

  handleIncrement = () => {
    this.props.handler(1);
  };

  handleDecrement = () => {
    this.props.handler(-1);
  };

  render() {
    return (
      <div>
        <button onClick={this.handleDecrement} disabled={this.props.disabled}>
          -
        </button>
        <button onClick={this.handleIncrement} disabled={this.props.disabled}>
          +
        </button>
      </div>
    );
  }
}

export default Counter;

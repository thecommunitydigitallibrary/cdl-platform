import Button from "@mui/material/Button";
import React from "react";

class ActionButton extends React.Component {
  render() {
    return (
      <div>
        <Button
          color={this.props.color ? this.props.color : "primary"}
          name={this.props.name ? this.props.name : ''}
          value={this.props.value ? this.props.value : ''}
          type={this.props.type}
          variant={this.props.variant}
          onClick={this.props.action}
          style={this.props.style ? this.props.style : {}}
          className="text-center bg-blue-500 rounded-md no-underline"
        >
          {this.props.children}
        </Button>
      </div>
    );
  }
}

export default ActionButton;

import React, { Component } from 'react';
import {ChatWindow} from './react-chat-window/src';
import { BrowserRouter as Router, Route } from 'react-router-dom'
class ChatApp extends Component {
  constructor() {
    super();
    this.state = {
      messageList: [],
      myId: ''
    };
  }

  joinRandom() {
    this.setState({
        messageList: []
    })
    this.sendToSocket({channel: 'random'});
  }

  _onMessageWasSent(message) {
    if (message.data.text && message.data.text.startsWith('/schedule ')) {
        const allowedUnits = ['hours', 'minutes', 'seconds']
        const messageRegex = /( message .*)/;

        let scheduleMsg;
        const scheduleData = {}
        let userScheduleInput;

        const result = messageRegex.exec(message.data.text)
        if (result) {
            scheduleMsg = result[0]
            scheduleMsg = scheduleMsg.slice(9,scheduleMsg.length)

            userScheduleInput = message.data.text.slice(0, result.index)
            if (userScheduleInput) {
                userScheduleInput = userScheduleInput.split(' ')

                for (let i=1; i<userScheduleInput.length; i++) {
                    if (allowedUnits.includes(userScheduleInput[i])) {
                        scheduleData[userScheduleInput[i]] = userScheduleInput[i+1]
                    }
                }
            }
        }

        if (Object.keys(scheduleData).length && scheduleMsg) {
            message.data = {'schedule': scheduleData, "text": scheduleMsg}
            this.sendToSocket(message);
        } else {
            alert("schedule command syntax is invalid. ex) /schedule seconds 5 message hello, world!")
        }
    } else {
        this.sendToSocket(message);
    }
  }

  componentDidMount() {
    this.setupSocket();
  }

  setupSocket(channel) {

    const room_name = this.props.match.params.name;
      const url = `ws://127.0.0.1:8000/${room_name}`;
    this.socket = new WebSocket(url);
    this.socket.onopen = (event) => {
        console.log(`Socket is connected to "${url}"`)
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data['id']) {
        this.setState({myId: data['id']})
        console.log('my id: ', this.state.myId);
      } else {
          this.setState({
              messageList: [...this.state.messageList, data]
      })
      }
    }
  }

  sendToSocket(message) {
    this.socket.send(JSON.stringify(message));
  }

  closeSocket() {
    this.socket.close();
  }

  componentWillUnmount() {
    this.closeSocket();
  }

  render() {
    return (
    <div>
        <ChatWindow
          messageList={this.state.messageList}
          onUserInputSubmit={this._onMessageWasSent.bind(this)}
          joinRandom={this.joinRandom.bind(this)}
          agentProfile={{
              teamName: 'chatterbox',
              imageUrl: 'https://a.slack-edge.com/66f9/img/avatars-teams/ava_0001-34.png'
          }}
          myId={this.state.myId}
          showEmoji
        />
    </div>)
  }
}

class App extends Component{
    render(){
        return (
        <Router>
            <Route exact path={'/'} component={ChatApp} />
            <Route path={'/:name'} component={ChatApp} />
        </Router>
    )
    }

}
export default App;

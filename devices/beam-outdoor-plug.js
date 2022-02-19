const RingSocketDevice = require('./base-socket-device')
const { RingDeviceType } = require('@tsightler/ring-client-api')

class BeamOutdoorPlug extends RingSocketDevice {
    constructor(deviceInfo, allDevices) {
        super(deviceInfo, 'lighting')
        this.deviceData.mdl = 'Outdoor Smart Plug'

        this.childDevices = {
            outlet1: allDevices.find(d => d.data.parentZid === this.device.id && d.deviceType === RingDeviceType.BeamsSwitch && d.data.relToParentZid === "1"),
            outlet2: allDevices.find(d => d.data.parentZid === this.device.id && d.deviceType === RingDeviceType.BeamsSwitch && d.data.relToParentZid === "2")
        }
        
        this.entity.outlet1 = {
            component: (this.childDevices.outlet1.data.categoryId === 2) ? 'light' : 'switch',
            name: `${this.childDevices.outlet1.name}`
        }

        this.entity.outlet2 = {
            component: (this.childDevices.outlet2.data.categoryId === 2) ? 'light' : 'switch',
            name: `${this.childDevices.outlet2.name}`
        }

        this.childDevices.outlet1.onData.subscribe((data) => {
            if (this.isOnline()) { this.publishOutlet1State() }
        })

        this.childDevices.outlet2.onData.subscribe((data) => {
            if (this.isOnline()) { this.publishOutlet2State() }
        })
    }

    publishData() {
        this.publishOutlet1State()
        this.publishOutlet2State()
        this.publishAttributes()
    }

    publishOutlet1State() {
        this.publishMqtt(this.entity.outlet1.state_topic, this.childDevices.outlet1.data.on ? "ON" : "OFF")
    }

    publishOutlet2State() {
        this.publishMqtt(this.entity.outlet2.state_topic, this.childDevices.outlet2.data.on ? "ON" : "OFF")
    }

    // Process messages from MQTT command topic
    processCommand(message, componentCommand) {
        const entityKey = componentCommand.split('/')[0]
        switch (componentCommand) {
            case 'outlet1/command':
                if (this.entity.hasOwnProperty(entityKey)) {
                    this.setOutletState(message, 'outlet1')
                }
                break;
            case 'outlet2/command':
                if (this.entity.hasOwnProperty(entityKey)) {
                    this.setOutletState(message, 'outlet2')
                }
                break;
            default:
                this.debug(`Received message to unknown command topic: ${componentCommand}`)
        }
    }

    // Set switch target state on received MQTT command message
    setOutletState(message, outletId) {
        this.debug(`Received set ${outletId} state ${message}`)
        const command = message.toLowerCase()
        switch(command) {
            case 'on':
            case 'off': {
                const duration = 32767
                const on = command === 'on' ? true : false
                const data = on ? { lightMode: 'on', duration } : { lightMode: 'default' }
                this.childDevices[outletId].sendCommand('light-mode.set', data)
                break;
            }
            default:
                this.debug(`Received invalid ${outletId} state command`)
        }
    }
}

module.exports = BeamOutdoorPlug
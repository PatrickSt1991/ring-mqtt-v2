const RingSocketDevice = require('./base-socket-device')

class FloodFreezeSensor extends RingSocketDevice {
    constructor(deviceInfo) {
        super(deviceInfo)
        this.deviceData.mdl = 'Flood & Freeze Sensor'

        this.entity.flood = {
            component: 'binary_sensor',
            device_class: 'moisture'
        }
        this.entity.freeze = {
            component: 'binary_sensor',
            device_class: 'cold'
        }
        this.initAttributeEntities()
    }
        
    publishData() {
        const floodState = this.device.data.flood && this.device.data.flood.faulted ? 'ON' : 'OFF'
        const freezeState = this.device.data.freeze && this.device.data.freeze.faulted ? 'ON' : 'OFF'
        this.publishMqtt(this.entity.flood.state_topic, floodState, true)
        this.publishMqtt(this.entity.freeze.state_topic, freezeState, true)
        this.publishAttributes()
    }
}

module.exports = FloodFreezeSensor
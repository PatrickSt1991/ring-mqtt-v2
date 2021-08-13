const RingSocketDevice = require('./base-socket-device')

class CoAlarm extends RingSocketDevice {
    constructor(deviceInfo) {
        super(deviceInfo)
        this.deviceData.mdl = 'CO Alarm'
        this.deviceData.mf = 'First Alert' // Hardcode for now until refactor for relationship support

        this.entity.co = {
            component: 'binary_sensor',
            device_class: 'gas',
            unique_id: this.deviceId
        }
        this.initAttributeEntities()
    }

    publishData() {
        const coState = this.device.data.alarmStatus === 'active' ? 'ON' : 'OFF'
        this.publishMqtt(this.entity.co.state_topic, coState, true)
        this.publishAttributes()
    }
}

module.exports = CoAlarm
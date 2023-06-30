import RingSocketDevice from './base-socket-device.js'

export default class SmokeCoListener extends RingSocketDevice {
    constructor(deviceInfo) {
        super(deviceInfo, 'alarm')
        this.deviceData.mdl = 'Smoke & CO Listener'

        this.entity.smoke = {
            component: 'binary_sensor',
            device_class: 'smoke'
        }
        this.entity.co = {
            component: 'binary_sensor',
            device_class: 'gas',
            name: `${this.deviceData.name} CO`, // Legacy compatibility
            unique_id: `${this.deviceId}_gas`  // Legacy compatibility
        }
    }

    publishState() {
        const smokeState = this.device.data.smoke && this.device.data.smoke.alarmStatus === 'active' ? 'ON' : 'OFF'
        const coState = this.device.data.co && this.device.data.co.alarmStatus === 'active' ? 'ON' : 'OFF'
        this.mqttPublish(this.entity.smoke.state_topic, smokeState)
        this.mqttPublish(this.entity.co.state_topic, coState)
        this.publishAttributes()
    }
}

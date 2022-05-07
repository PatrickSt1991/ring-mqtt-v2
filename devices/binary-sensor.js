const RingSocketDevice = require('./base-socket-device')
const { RingDeviceType } = require('ring-client-api')
const utils = require( '../lib/utils' )

class BinarySensor extends RingSocketDevice {
    constructor(deviceInfo) {
        super(deviceInfo, 'alarm')
        let device_class = 'None'
        let bypass_modes = false

        // Override icons and and topics
        switch (this.device.deviceType) {
            case RingDeviceType.ContactSensor:
                this.entityName = 'contact'
                this.deviceData.mdl = 'Contact Sensor'
                device_class = (this.device.data.subCategoryId == 2) ? 'window' : 'door'
                bypass_modes = [ 'never', 'faulted', 'always' ]
                break;
            case RingDeviceType.MotionSensor:
                this.entityName = 'motion'
                this.deviceData.mdl = 'Motion Sensor',
                device_class = 'motion'
                bypass_modes = [ 'never', 'always' ]
                break;
            case RingDeviceType.RetrofitZone:
                this.entityName = 'zone'
                this.deviceData.mdl = 'Retrofit Zone'
                device_class = 'safety'
                bypass_modes = [ 'never', 'faulted', 'always' ]
                break;
            case RingDeviceType.TiltSensor:
                this.entityName = 'tilt'
                this.deviceData.mdl = 'Tilt Sensor'
                device_class = 'garage_door'
                bypass_modes = [ 'never', 'faulted', 'always' ]
                break;
            case RingDeviceType.GlassbreakSensor:
                this.entityName = 'glassbreak'
                this.deviceData.mdl = 'Glassbreak Sensor'
                device_class = 'safety'
                bypass_modes = [ 'never', 'always' ]
                break;
            default:
                if (this.device.name.toLowerCase().includes('motion')) {
                    this.entityName = 'motion'
                    this.deviceData.mdl = 'Motion Sensor',
                    device_class = 'motion'
                } else {
                    this.entityName = 'binary_sensor'
                    this.deviceData.mdl = 'Generic Binary Sensor'
                    device_class = 'None'
                }
        }

        this.entity[this.entityName] = {
            component: 'binary_sensor',
            device_class: device_class,
            isLegacyEntity: true  // Legacy compatibility
        }

        // Only official Ring sensors can be bypassed
        if (bypass_modes) {
            const savedState = this.getSavedState()

            this.data = {
                bypass_mode: savedState?.bypass_mode ? savedState.bypass_mode: 'Never',
                published_bypass_mode: false
            }

            this.entity.bypass_mode = {
                component: 'select',
                options: bypass_modes
            }

            this.updateDeviceState()
        }
    }

    updateDeviceState() {
        const stateData = {
            bypass_mode: this.data.bypass_mode
        }
        this.setSavedState(stateData)
    }

    publishState(data) {
        const isPublish = data === undefined ? true : false
        const contactState = this.device.data.faulted ? 'ON' : 'OFF'
        this.mqttPublish(this.entity[this.entityName].state_topic, contactState)
        this.publishBypassModeState(isPublish)
        this.publishAttributes()
    }

    publishBypassModeState(isPublish) {
        if (this.entity?.bypass_mode) {
            if (this.data.bypass_mode !== this.data.published_bypass_mode || isPublish) {
                this.data.published_bypass_mode = this.data.bypass_mode.state
                this.mqttPublish(this.entity.bypass_mode.state_topic, this.data.bypass_mode)
            }
        }
    }

    // Process messages from MQTT command topic
    processCommand(command, message) {
        switch (command) {
            case 'bypass_mode/command':
                if (this.entity?.bypass_mode) {
                    this.setBypassMode(message)
                }
                break;
            default:
                this.debug(`Received message to unknown command topic: ${command}`)
        }
    }

    // Set Stream Select Option
    async setBypassMode(message) {
        if (this.entity.bypass_mode.options.includes(message)) {
            this.debug(`Received set bypass mode to ${message}`)
            this.data.bypass_mode = message
            this.publishBypassModeState()
            this.updateDeviceState()
        } else {
            this.debug(`Received invalid bypass mode for this sensor: ${message}`)
        }
    }
}

module.exports = BinarySensor

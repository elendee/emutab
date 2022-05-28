import config from './config.js?v=22'

const user = {}

if( config.EXPOSE ) window.USER = user

export default user
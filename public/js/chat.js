const socket = io()
const $messageForm = document.querySelector('#message-form')
const $sendButton = $messageForm .querySelector('button')
const $sendInput = document.querySelector('input')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const template = document.querySelector('#message-template').innerHTML
const locationtemplate = document.querySelector('#location-message-template').innerHTML
const sidebartemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild
    
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrolloffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrolloffset){
        $messages.scrollTop =  $messages.scrollHeight
    }
}

socket.on('message', (welcome) => {

    console.log(welcome)
    const html = Mustache.render(template,{
        username: welcome.username,
        renderMessage: welcome.text,
        createdAt: moment(welcome.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationtemplate,{
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$messageForm.addEventListener('submit',(e) => {

    e.preventDefault()
    $sendButton.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage',message,(error) => {

        $sendButton.removeAttribute('disabled')
        $sendInput.value = ''
        $sendInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Message is delivered')
    })
})

$sendLocationButton.addEventListener('click', () => {

    if(!navigator.geolocation){
        return alert('Not able to find the location')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((location)=>{

        $sendLocationButton.removeAttribute('disabled')

        socket.emit('sendLocation', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        },() => {
            console.log('Location Shared successfully!')
        })
    })
})

socket.emit('join', { username, room },(Error) => {
    if(Error){
        alert(Error)
        location.href = '/'
    }
})

socket.on('roomData',({ room, users }) => {
    const html = Mustache.render(sidebartemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
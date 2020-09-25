const socket = io();

// Elements 

const $messageForm = document.querySelector('#message-form');
const $messageFromInput = $messageForm.querySelector('input');
const $messageFromButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search,{ ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message
    const $newMessage = $messages.lastElementChild;

    // Height of the last message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    console.log(newMessageMargin);
    // Visible height

    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

}

socket.on('message',(message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:m a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()
})

socket.on('roomData',({ room, users }) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFromButton.setAttribute('disabled','disabled')
    //disable
    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {

        $messageFromButton.removeAttribute('disabled');
        $messageFromInput.value = '';
        $messageFromInput.focus();

        //enable

        if(error){
            return console.log(error)
        } 
        console.log('Message delivered');
    })
})

$locationButton.addEventListener('click', () => {
    if(navigator.geolocation) {
        return alert('Geolocation is not suported by your browser.')
    }

    $locationButton.setAttribute('disabled','disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        })
    },() => {
        $locationButton.removeAttribute('disabled');
        console.log("Location shared");
    })
})

socket.emit('join', { username, room },(error) => {
    if(error){
        alert(error);
        location.href="/"
    }
});

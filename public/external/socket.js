function initChat(token, uri) {
  var importedjs = document.createElement('script');
  importedjs.src = uri+'/js/socket.js';
  document.head.appendChild(importedjs);

  var importedcss = document.createElement("link");
  importedcss.rel = "stylesheet";
  importedcss.href = uri+'/css/socket.css';
  document.head.appendChild(importedcss);

  window.onload = function(e){ 
    var mainDiv = `<div class="chatcontent">
        <div class="chatbox">
          <div id="myChat" class="my-well">
              <div class="output"></div>
              <input type="text" class="mt-1 my-form-control messageInputUser" onkeypress="chatToAdmin(event)">
          </div>
          <button type="button" onclick="toggleElement()" class="my-btn-dark userMsgBtn">Live chat<span id="notReadAdminMessageCount"></span></button>
        </div>
        <div class="namebox">
          <input type="text" class="my-form-control userName" placeholder="Name" onkeypress="setUsernameInput(event)">
          <button class="my-btn-dark startChat" onclick="setUsername()">Enter your name to start chat</button>
        </div>
      </div>`;

    document.querySelector('body').insertAdjacentHTML("beforeend", mainDiv);
    output = document.querySelector('.output');
    chatbox = document.querySelector(".chatbox");
    namebox = document.querySelector(".namebox");
    userMsgBtn = document.querySelector(".userMsgBtn");
    messageInputUser = document.querySelector(".messageInputUser");
    chat = io(`${uri}/chat?token=${token}`);
    
    chat.on('enterUser', function (newUser) {
      if(newUser.isAdminConnected){
        output.insertAdjacentHTML("beforeend",` <p><b>Admin</b>: Hey ${newUser.name}. Can I help you?</p>`);
      }else{
        output.insertAdjacentHTML("beforeend",` <p><b>Admin</b>: Hey ${newUser.name}. We dont have admin online for now. Stay around and we will catch you as soon as possible, or just try to connect later.</p>`);
      }
      namebox.style.display = "none";
      chatbox.style.display = "block";
      userMsgBtn.setAttribute('data-name', newUser.name);
    });
      
    chat.on('adminChatToUser', function (data) {
      output.insertAdjacentHTML("beforeend",` <p><b>Admin</b>: ${data.message} </p>`);
      output.scrollTop = 99999999;
      var x = document.getElementById("myChat");
      if (x.style.display === "none") {
        var oldCount = document.getElementById("notReadAdminMessageCount").innerText;
        document.getElementById("notReadAdminMessageCount").innerText = ' ' + (Number(oldCount) + 1);
      }
    });
  }
}

function chatToAdmin(e) {
  if(e.which == 13){
    var name =  document.querySelector('.userMsgBtn').getAttribute('data-name');
    var message =  document.querySelector('.messageInputUser').value;
    output.insertAdjacentHTML("beforeend",`<p><b>${name}</b>: ${message} </p>`);
    messageInputUser.value = '';
    chat.emit('chatToAdmin', { message: message, });
    output.scrollTop = 99999999;
  }
}

function setUsernameInput(e) {
  if(e.which == 13){
    var name  = document.querySelector('.userName').value;
    chat.emit('setusername', name);
  }
}

function setUsername() {
  var name  = document.querySelector('.userName').value;
  chat.emit('setusername', name);
}

function toggleElement() {
  var x = document.getElementById("myChat");
  if (x.style.display === "none") {
    x.style.display = "block";
    document.getElementById("notReadAdminMessageCount").innerText = '';
  }else{
    x.style.display = "none";
  }
}

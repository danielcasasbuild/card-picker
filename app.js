let data={}

async function loadData(){
const res=await fetch("cards.json")
data=await res.json()
}

loadData()

function setCard(type,card){

document.getElementById(type+"Name").innerText=card.name
document.getElementById(type+"Logo").src="icons/"+card.logo

}

function pick(key){

const result=data[key]

if(!result){
document.getElementById("bestName").innerText="Unknown"
document.getElementById("backupName").innerText=""
return
}

setCard("best",result.best)
setCard("backup",result.backup)

document.getElementById("reason").innerText=result.reason

}

document.getElementById("search").addEventListener("change",e=>{
const val=e.target.value.toLowerCase()

for(let key in data){

if(key.includes(val)){
pick(key)
return
}

}

})

if("serviceWorker" in navigator){
navigator.serviceWorker.register("service-worker.js")
}

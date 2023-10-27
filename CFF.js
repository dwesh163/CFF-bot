const fetch = require("node-fetch");
const fs = require('fs');
const { title } = require("process");

module.exports = function() { 
    this.sethomeFunction = function(a, b) { 
        return "vive les pacerette";
    };
    this.fetchAPI = async function(from, to, mobile, userID, filePath) { 

        try {
            const response = await fetch(`http://transport.opendata.ch/v1/connections?from=${from}&to=${to}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            fs.writeFileSync(`${userID}.json`, JSON.stringify(responseData, null, 3));
            //return getSpecifiedData(JSON.parse(JSON.stringify(responseData, null, 2)), userID, filePath, 1)
            return transformData(JSON.parse(JSON.stringify(responseData, null, 2)), userID, filePath);
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    };
    
};

function getHeader(data, size, userID, filePath, travelNumber){
    let sizeArrow = 12
    let travelFrom = data["stations"]["from"][0]["name"]
    let travelTo = data["stations"]["to"][0]["name"]
    let title = `${travelFrom}  ${"-".repeat(sizeArrow)}>  ${travelTo}`
    let sizeSpace = (size - (title.length))/2 -4
    let text = ""

    // if (JSON.parse(fs.readFileSync(filePath))[userID]["mobile"]){
    //     size = JSON.parse(fs.readFileSync(filePath))[userID]["size"]
    // }

    sizeArrow = size/5

    if (sizeSpace % 2 == 0){
        sizeArrow += 1
        title = `${travelFrom}  ${"-".repeat(sizeArrow)}>  ${travelTo}`
        sizeSpace = (size - title.length)/2
    }

    sizeSpace -= 3

    text += (`${"-".repeat(size)}\n`);
    text += (`${" ".repeat(sizeSpace)} ${title}\n`)
    if(travelNumber != "null"){
        let travel = data["connections"][travelNumber]
        let timeFrom = (new Date(travel["from"]["departure"]).toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'}));
        let timeTo = (new Date(travel["to"]["arrival"]).toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'}));
        text += (`   ${timeFrom} ${"-".repeat(size - 25)} ${timeTo}\n`)
    }
    text += (`${"-".repeat(size)}\n\n`); 

    return text
}

function transformData(data, userID, filePath) {
    let size = 96
    let text = getHeader(data, size, userID, filePath, "null")

    for (let travelNumber = 0; travelNumber < Object.keys(data["connections"]).length; travelNumber++) {
        travel = data["connections"][travelNumber]
        journey = travel["sections"][0]["journey"]
        let number = ""
        let timeFrom = (new Date(travel["from"]["departure"]).toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'}));
        let timeTo = (new Date(travel["to"]["arrival"]).toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'}));
        let timeTravel = travel["duration"].split('d')[1].split(':')
        let newtimeTravel = ""
        let platform = ""
        
        if (journey["category"] != "RE" || journey["category"] != "EC") {
            number = ` ${journey["number"]}`
        }

        if (travel["from"]["platform"] != null){
            platform = `platform ${travel["from"]["platform"]}`
        }

        if (timeTravel[0] >= 1){
            if (timeTravel[0].startsWith('0')) {
                newtimeTravel += `${timeTravel[0].slice(1)} h `
            }
            else{
                newtimeTravel += `${timeTravel[0]} h `
            }
        }

        if (timeTravel[1].startsWith('0')) {
            newtimeTravel += `${timeTravel[1].slice(1)} min `
        }
        else{
            newtimeTravel += `${timeTravel[1]} min `
        }
        
        text += (`   ${journey["category"]}${number} Direction ${journey["to"]}\n`)
        text += (`   ${timeFrom} ${"-".repeat(size - 22)} ${timeTo}\n`)
        text += (`   ${platform}${" ".repeat(size - 17 - newtimeTravel.length - platform.length)} ${newtimeTravel}\n\n`)

        
    }

    return text
    
}

function getSpecifiedData(data, userID, filePath, travelNumber) {
    let size = 96
    let text = getHeader(data, size, userID, filePath, travelNumber)
    console.log(getHeader(data, size, userID, filePath, travelNumber))
    travel = data["connections"][travelNumber]

    for (let sectionNumber = 0; sectionNumber < Object.keys(travel["sections"]).length; sectionNumber++) {
        travelData = travel["sections"][sectionNumber]

        let travelFrom = travelData["departure"]["station"]["name"]
        let travelTo = travelData["arrival"]["station"]["name"]
        let timeFrom = (new Date(travelData["departure"]["departure"]).toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'}));
        let timeTo = (new Date(travelData["arrival"]["arrival"]).toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'}));
        let platformFrom = ""
        let platformTo = ""
        let platformFromLenght = 0
        let platformToLenght = 0

        if (travelData["departure"]["platform"] != null){
            platformFrom = `platform ${travelData["departure"]["platform"]}`
            platformFromLenght = platformFrom.length
        }
        if (travelData["arrival"]["platform"] != null){
            platformTo = `platform ${travelData["arrival"]["platform"]}`
            platformToLenght = platformFrom.length
        }

        console.log(size, "full")
        console.log(size - 8, "space")
        console.log(size - 8 - travelFrom.length, "base")
        console.log(platformFromLenght, "platformFromLenght")
        console.log(size - 8 - travelFrom.length - platformFromLenght, "after")
        console.log(platformToLenght, "platformToLenght")


        text += `   ${timeFrom} ● ${travelFrom}${" ".repeat(size - 40  - travelFrom.length - platformFromLenght)}\n`
        for (let index = 0; index < 2; index++) {
            text += `              |\n`
            
        }
        text += `   ${timeTo} | ${travelTo}${" ".repeat(size - 40  - travelTo.length - platformToLenght)}\n\n`

        
        console.log(size - 8 - travelTo.length - platformToLenght)
    }

    return text

}
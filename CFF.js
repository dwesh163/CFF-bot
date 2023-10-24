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
            
            return transformData(JSON.parse(JSON.stringify(responseData, null, 2)), userID, filePath);
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    };
};

function transformData(data, userID, filePath) {
    let text = ""
    let size = 96
    let sizeArrow = 12

    let title

    if (JSON.parse(fs.readFileSync(filePath))[userID]["mobile"]){
        size = JSON.parse(fs.readFileSync(filePath))[userID]["size"]
    }

    sizeArrow = size/5

    let travelFrom = data["stations"]["from"][0]["name"]
    let travelTo = data["stations"]["to"][0]["name"]

    title = `${travelFrom}  ${"-".repeat(sizeArrow)}>  ${travelTo}`

    title = `${travelFrom}  ${"-".repeat(sizeArrow)}>  ${travelTo}`

    
        let sizeSpace = (size - (title.length))/2
        
    
        if (sizeSpace % 2 == 0){
            sizeArrow += 1
            title = `${travelFrom}  ${"-".repeat(sizeArrow)}>  ${travelTo}`
            sizeSpace = (size - title.length)/2
        }
    
        sizeSpace -= 3
    
        text += (`${"-".repeat(size)}\n`);
        text += (`${" ".repeat(sizeSpace)} ${title}\n`)
        text += (`${"-".repeat(size)}\n\n`); 
    

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
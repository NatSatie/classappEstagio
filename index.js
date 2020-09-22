'use strict'
const fs = require('fs')
const neatCsv = require('neat-csv')
const PNF = require("google-libphonenumber").PhoneNumberFormat;
const phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();

var resultado = null

function studentExistsInDatabase(data, student){
  for(var i=0; i<data.length;i++){
    //console.log("I = "+ i)
    //console.log(data[i])
    if ( (data[i].fullname == student.fullname) && (data[i].eid== student.eid)){
      return i
    }
  } return -1
}

function rmvBadCharacters(str){
  var temp1 = str.replace(new RegExp(':', 'g'), "")
  var temp2 = temp1.replace(new RegExp(/[()]/, 'g'), "")
  return temp2
}

function splitStrings(array){
  var splited = []
  if (Array.isArray(array)){
    for(var i=0;i<array.length;i++){
      var temp = array[i]
      if ((temp.includes(',') || (temp.includes('/')) )!= -1){
        splited = temp.split(/[,/:]/)
      }
    }
  } else {
    if ((array.includes(',') || (array.includes('/')) )!= -1){
      splited = array.split(/[,/]/)
    }
  }
  for(i=0;i<splited.length;i++){
    splited[i] = splited[i].trim()
    if (splited[i] == ''){
      splited.splice(i)
    }
  }
  return splited
}

function getStudentClasses(classes){
  var newClasses = splitStrings(classes)
  return newClasses
}

function getPropAsString(info){
  var strList = []
  for( var i in info)
    strList.push( i.toString() )
  return strList
}

function isValidEmail(email){
  if ((email.search(".com") != -1) && (email.search("@") != -1) )
    return true
  return false
}

function isValidPhone(phone){
  try {
    var res = phoneUtil.isValidNumberForRegion(phoneUtil.parse(phone, 'BR'), 'BR')
    //console.log( res)
    return res
  } catch(err){
    return false
  } return false 
}

function getStudentAddresses(info, propNames){
  var newAddresses = []
  for(var i=3;i<propNames.length-2;i++){
    var contact = rmvBadCharacters(info[propNames[i].toString()])
    if (contact != ''){
      var mainTags = propNames[i].split(" ")
      if (( mainTags[0] == "email") && (isValidEmail(contact)) ) {
        var addressContact = {
          type: null,
          tags: [],
          address: null
        }
        addressContact.type = mainTags[0]
        for(var j=1; j < mainTags.length; j++){
          var auxTag = mainTags[j].replace(new RegExp(',', 'g'), "")
          addressContact.tags.push(auxTag )
        }
        addressContact.address = contact
        newAddresses.push(addressContact)
      } else  if (( mainTags[0] == "phone") && (isValidPhone(contact)) ){
        var addressContact = {
          type: null,
          tags: [],
          address: null
        }
        addressContact.type = mainTags[0]
        for(var j=1; j < mainTags.length; j++){
          var auxTag = mainTags[j].replace(new RegExp(',', 'g'), "")
          addressContact.tags.push(auxTag )
        }
        addressContact.address = contact
        newAddresses.push(addressContact)
      }
    }
  }
  return newAddresses
}

function makeBoolean(str){
  if ((str=='0')||(str=='no'))
    return false
  else if ((str=='1')||(str=='yes'))
    return true
  else if (str=='')
    return null
}

function createNewStudent(info, propNames){
  var newStudent = {
    fullname: null,
    eid: null,
    class: [],
    addresses: [],
    invisible: null,
    see_all: null
  }
  newStudent.fullname = info.fullname
  newStudent.eid = info.eid
  newStudent.class = getStudentClasses(info.class)
  newStudent.addresses = getStudentAddresses(info, propNames)
  newStudent.invisible = makeBoolean(info.invisible)
  newStudent.see_all = makeBoolean(info.see_all)
  return newStudent
}

async function readData(info){
  var studentData = []
  var propNames = getPropAsString(info[0])
  studentData.push( createNewStudent(info[0], propNames) )
  for (var i=1;i<info.length;i++){
    var student = info[i]
    var existDuplicate = studentExistsInDatabase(studentData, student)
    if ( existDuplicate != -1 ){
      var addClass = getStudentClasses(student.class)
      var addAddress = getStudentAddresses(student,propNames)
      var addInvisible = makeBoolean(student.invisible)
      var addSee_all = makeBoolean(student.see_all)
      if (Array.isArray(addClass)){
        for(var j=0;j<addClass.length;j++){
          studentData[existDuplicate].class.push(addClass[j])
        }
      } else {
        studentData[existDuplicate].class.push(addClass)
      }
      if (Array.isArray(addAddress)){
        for(var j=0;j<addAddress.length;j++){
          studentData[existDuplicate].addresses.push(addAddress[j])
        }
      } else {
        studentData[existDuplicate].addresses.push(addAddress)
      }
      if (studentData[existDuplicate].invisible == null)
        studentData[existDuplicate].invisible = addInvisible
      if (studentData[existDuplicate].see_all == null)
        studentData[existDuplicate].see_all = addSee_all
    } else {
      studentData.push( createNewStudent(student, propNames) )
    }
    
  } 
  return studentData
}

function main(){
  var constGetData = () => {
    return new Promise(
      function(resolve, reject){
        fs.readFile('./input.csv', async (err,data) => {
          if (err) {
            return reject(err)
          } 
          var aux = readData(await neatCsv(data))
          //console.log(aux)
          resolve(aux)
          })
      } 
    )} 
  constGetData().then((res) => {
    console.log(JSON.stringify(res, null, 2))
    fs.writeFileSync('output.json', JSON.stringify(res, null, 2));
  })
}

main()

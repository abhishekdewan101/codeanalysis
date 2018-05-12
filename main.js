var recursive = require("recursive-readdir");
var path = require('path');
var fs = require('fs');
var lineReader = require('line-by-line');
var jsonFile = require('jsonfile');
var colors = require('colors');

var filePath = '/Users/a.dewan/Documents/workspace/android/samsung-health/Expert/Consultation/src/com/samsung/android/app/shealth/expert/consultation/us';

startCodeAnalysis();

var lr;
var rules;
var ignore;

function startCodeAnalysis() {
    console.log("Provide me the path to the directory to be analyzed:")
    let stdin = process.openStdin();
    stdin.addListener('data', function(data){
        filePath = data.toString().trim();
        setupRules();
        process.closeStdin();
    });
}

function setupRules() {
    jsonFile.readFile("text_rules.json", function(err,data){
        rules = data["rules"];
        ignore = data["ignore"];
        getAllFiles();
    });
}

function getAllFiles() {
    recursive(filePath, function(err,data) {
        if (err != null) {
            console.log(err);
        } 
        analyzeFiles(data);
    });
}

function isFileJavaFile(file) {
    return (path.basename(file).includes(".java"));
}

function analyzeFiles(files) {
    files.forEach(filePath => {
        if (isFileJavaFile(filePath)) {
            lr = new lineReader(filePath);
            setupLineReader(filePath);
        }
    });
}

function setupLineReader(filePath) {
    let lines = [];
    let lineNumber = 0;
    lr.on('error',function(err){
        console.log("Line Reader encountered an error", err);
    });

    lr.on('line',function(line){
        if (line.doesLineViolateRules()) {
            lines.push(`${lineNumber}. `.concat(line));
        }
        lineNumber++;
    });

    lr.on('end', function(){
        if (lines.length > 0) {
            console.log(path.basename(filePath).blue);
            lines.forEach(line => {
                console.log(line.red);
            });
        }
    });
}

Object.prototype.doesLineViolateRules = function() {
    let isRuleViolated = false;
    rules.forEach(rule => {
        if (this.includes(rule)) {
            isRuleViolated = true;
        }
    });
    ignore.forEach(ignore => {
        if (isRuleViolated && this.includes(ignore)) {
            isRuleViolated = false;
        }
    });
    return isRuleViolated;
}
const { defineConfig }=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests',timeout:30000,workers:2,reporter:'list',use:{baseURL:'http://127.0.0.1:4178',headless:true},projects:[{name:'chrome',use:{channel:'chrome'}},{name:'webkit',use:{browserName:'webkit'}}]});

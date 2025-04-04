const Banner = require("../../model/bannerSchema");
const path = require("node:path");
const fs = require("node:fs");


const loadBannerPage = async (req,res)=>{
    try {

        const findBanner = await Banner.find({});
        res.render("banner",{data:findBanner,pageTitle:"Banners"});

    } catch (error) {
        console.log("something went wrong while loading banner page:",error);
        res.redirect("/pageError");
    }
}

const getAddBannerPage = async (req,res)=>{
    try {
        res.render("addBanner",{pageTitle:"Add Banner"});

    } catch (error) {

        console.log("something went wrong while loading addbanner page:",error);

        res.redirect("/pageError");
    }
}

const addBanner = async (req,res)=>{
    try {
        const data = req.body;
        const image = req.file;
        const newBanner = new Banner({
            image:image.filename,
            title:data.title,
            description:data.description,
            startDate: new Date(data.startDate + "T00:00:00"),
            endDate: new Date(data.endDate + "T00:00:00"),
            link : data.link,
        });

        await newBanner.save().then((data)=>{
            console.log("Saved Data",data);
            res.redirect('/admin/banner');
        })
        
        
    } catch (error) {
        console.log("error occured while adding banner",error);
        res.redirect("/pageError");
        
    }
}

module.exports = {
    loadBannerPage,
    getAddBannerPage,
    addBanner,
}
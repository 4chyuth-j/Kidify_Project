



const pageNotFound = async(req,res)=>{
  try{
   res.render('page-404')

  } catch(error){
     res.redirect("/pageNotFound");
  }
};



const loadHomepage = async (req,res)=>{
   try{
      
    return res.render("home.ejs");

   } catch(error){
    console.log("home page not found\n",error);
    res.status(500).send("servor error");
   }
};


module.exports= {
    loadHomepage,
    pageNotFound,
}
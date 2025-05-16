const load404 = (req, res) => {
res.status(404).render("admin-error",{pageTitle:"Page not found"});
};

module.exports = { load404 };
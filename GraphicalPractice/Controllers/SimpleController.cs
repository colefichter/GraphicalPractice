using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace GraphicalPractice.Controllers
{
    public class SimpleController : Controller
    {
        //
        // GET: /Simple/

        public ActionResult Index()
        {
            return View();
        }       
    }
}

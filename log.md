# Simpatico Log

This is where I record things that are interesting.


12/10/19 Digging into SVG DOM  -  `elt.contentDocument` and `elt.getCTM`
====================================================================================

I thought you couldn't do it. I tried to build a fast workflow between affinity designer and simpatico using SVG, but failed to dig into an svg that's referenced as an image.

However, you can get it as `elt.contentDocument` https://stackoverflow.com/questions/11434916/javascript-accessing-inner-dom-of-svg#11435082

This in turn got me to wondering what else I don't know about SVG. Turns out to be quite a lot! For example, there are already methods defined to get the coordinate transformation matrix from screen-to-any-elt, something I was pushing toward in svg-foobar.html. 

https://stackoverflow.com/questions/10281732/js-svg-getctm-and-setctm
elt.getCTM();

Then I started to read https://svgwg.org/svg2-draft/ and it turns out theres all kinds of things in there. It's a rabbit hole. The SVG values alone are interesting - apparently it does support radians and gradians???

Another useful SVG resource: 
http://tutorials.jenkov.com/svg/svg-viewport-view-box.html
http://www.cheat-sheets.org/own/svg/index.xhtml
https://css-tricks.com/scale-svg/
http://www.inkfood.com/collision-detection-with-svg/
getIntersectionList() and checkIntersection()

function intersectRect(r1, r2) {
    var r1 = r1.getBoundingClientRect();    //BOUNDING BOX OF THE FIRST OBJECT
    var r2 = r2.getBoundingClientRect();    //BOUNDING BOX OF THE SECOND OBJECT

    //CHECK IF THE TWO BOUNDING BOXES OVERLAP
  return !(r2.left > r1.right || 
           r2.right < r1.left || 
           r2.top > r1.bottom ||
           r2.bottom < r1.top);
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

function isPointInPoly(poly, pt){

    for(let c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
	    (poly[i].y <= pt.y && pt.y < poly[j].y) || 
		(poly[j].y <= pt.y && pt.y < poly[i].y) && 
		(pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) && 
		(c = !c);
    }

    return c;
}



## 12/11/19 - "Reimagining the PhD" inspires potential Simpatico funding
====================================================================================
"Reimagining the PhD" describes one persons career as an independent CS researcher! Something worth considering for myself, with Simpatico. She talks about the practicalities. I also really like the URL. https://nadiaeghbal.com/phd


## 12/13/19 - "Happy Hues" inspires with some good color schemes; Microbrowsers
====================================================================================
Eventually Simpatico is going to need a website, and this was inspirational. I liked the colors and the design. https://www.happyhues.co/ Apparently it's just a side project from a designer, who didn't even code it (he used WebFlow) but it looks great.

In other Simpatico website news, it would be nice to have good support for "microbrowsers" which are those little cards that show up in chat clients and social media posts that preview your resource. Apparently there are special tags for this, mostly OpenGraph. I find it interesting that normal analytics are stymied - becase I don't plan to do normal analytics. https://24ways.org/2019/microbrowsers-are-everywhere/


## 12/17/19 Ctags in sublime.
====================================================================================


inspired by https://blog.mindlessness.life/2019/12/01/tags-simplified.html
installed https://github.com/SublimeText/CTags into sublime
ran brew install ctags
ran ctags -R -f .tags in simpatico.

"By default, Sublime will include ctags files in your project, which causes them to show up in the file tree and search results."

Usage

rebuild_ctags 	ctrl+t, ctrl+r 	  	 
navigate_to_definition 	ctrl+t, ctrl+t 	ctrl+> 	ctrl+shift+left_click
jump_prev 	ctrl+t, ctrl+b 	ctrl+< 	ctrl+shift+right_click
show_symbols 	alt+s 	  	 
show_symbols (all files) 	alt+shift+s 	  	 
show_symbols (suffix) 	ctrl+alt+shift+s  	 

Basically, it's not very good, so far, and it's unlikely I'll use it much. If I want to go in this direction I might just use VS Code or even IntelliJ.

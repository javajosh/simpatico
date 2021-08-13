import {as, getType, cast, hasProp} from './core.js';

const {elt:ELT, obj:OBJ} = as;

/**
 * Scatter the entries of obj onto the attributes of elt. There is no return because it is pure side effect.
 *
 * @param elt The target HTML element
 * @param obj The source javascript object
 */
const scatter = (elt, obj) => {
  ELT(elt) && OBJ(obj);
  // x and y coords are applied as cx cy coords, if not already set.
  if (elt.tagName === "circle") {
    if (hasProp(obj, 'x') && !hasProp(obj, 'cx')) obj.cx= obj.x;
    if (hasProp(obj, 'y') && !hasProp(obj, 'cy')) obj.cy= obj.y;
  }
  for (const key in obj){
    const old = elt.getAttribute(key);
    if (obj[key] + '' !== old)
    elt.setAttribute(key, obj[key]);
  }
};

/**
 * Gather the attributes of an element that match the keys present in an object, overwriting the values in
 * the object argument. This method correctly casts numbers and booleans from strings.
 *
 * @param elt The source HTML element
 * @param obj The target javascript object
 * @returns {{}}
 */
const gather = (elt, obj) => {
  ELT(elt) && OBJ(obj);
  for (const key in obj){
    if (!elt.hasAttribute(key)) continue;
    const val = elt.getAttribute(key);
    const type = getType(obj[key]);
    obj[key] = cast(type, val);
  }
  return obj;
};

/**
 * Create an object representation from a string transform representation. Note: this is not complete.
 *
 * @param elt
 * @returns {{}}
 */
const parseTransform =  elt => {
  const result = {};
  const transformList = elt.transform.baseVal;
  for (let transform of transformList){
    const m = transform.matrix;
    switch (transform.type) {
      case 2: result.translate = {x:m.e, y:m.f}; break;
      case 3: result.scale = {x:m.a, y:m.d}; break;
      case 4: result.rotate = {angle: transform.angle}; break; //TODO handle rotate(angle, x, y) form
      case 5: break; // TODO skewX()
      case 6: break; // TODO skewY(()
      case 1: break; // probably the matrix form.
      default:
    }
  }
  return result;
};

/**
 * Create a string transform from an object representation.
 *
 * @param obj
 * @returns {string}
 */
const renderTransform = obj => {
  let result = '';
  Object.entries(obj).forEach(([key, value]) => {
    const inside = Object.values(value).join(',');
    result += `${key}(${inside})`;
  });
  return result;
};


/**
 * Given two rectangles in the form {top:a, bottom:b, left: c, right: d} return true if they intersect.
 *
 * @param r1 {{top:a, bottom:b, left: c, right: d}}
 * @param r2 {{top:a, bottom:b, left: c, right: d}}
 * @returns {boolean} true if they intersect
 */
const intersectRect = (r1, r2) => !(
    r2.left   > r1.right  ||
    r2.right  < r1.left   ||
    r2.top    > r1.bottom ||
    r2.bottom < r1.top
  );

const isInsideRec = ({x, y}, {N, S, E, W}) => (N <= y && y <= S) && (E <= x && x <= W);

/**
 * Compute whether the bounding boxes of two elements intersect.
 * Note that type assertions would be correct, but slow down this code which tends to be called very frequently
 * in simulations and animations.
 *
 * @param e1 An SVG or HTML element.
 * @param e2 Another SVG or HTML element.
 * @returns {boolean} True if the elements bounding rectangle intersect, false otherwise.
 */
const intersectingElts =  (e1, e2) => intersectRect(e1.getBoundingClientRect(), e2.getBoundingClientRect());

/**
 * Compute whether the given point is contained within the list of points. This function has more than
 * a little voodoo.
 *
 * @param poly A list of points in {x,y} format, e.g. [{x:1,y:3},{x:0,y:-7},{x:23,y:-10}]
 * @param point An object representation of a point like {x:1, y:3}
 * @returns {boolean} True if the point is contained within the polygon formed by the list of points.
 */
const isPointInPoly = (poly, point) => {
  const {x,y} = point;
  const len = poly.length;
  let i = -1, j = len -1;
  for(; ++i < len; j = i){
    const {x:xi, y:yi} = poly[i];
    const {x:xj, y:yj} = poly[j];
    if ((
      (yi <= y && y < yj) ||  // y sits between two adjacent y's of the poly
      (yj <= y && y < yi)
    ) && (x <                 // x is less than...some mysterious number!
      xi + (xj - xi) * (y - yi) / (yj - yi)
    )) return true;
  }
  return false;
}

export         {scatter, gather, parseTransform, renderTransform, intersectRect, isInsideRec, intersectingElts, isPointInPoly};
export default {scatter, gather, parseTransform, renderTransform, intersectRect, isInsideRec, intersectingElts, isPointInPoly};


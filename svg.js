
const {ELT, OBJ} = ASSERT;

/**
 * Handy SVG utilities.
 */


/**
 * Scatter the entries of obj onto the attributes of elt. There is no return because it is pure side effect.
 * @param elt The target HTML element
 * @param obj The source javascript object
 */
const scatter = (elt, obj) => {
  ELT(elt) && OBJ(obj);
  for (const key in obj){
    const old = elt.getAttribute(key);
    if (obj[key] + '' !== old)
    elt.setAttribute(key, obj[key]);
  }
}

/**
 * Gater the attributes of an element that match the keys present in an object, overwriting the values in the object.
 *
 *
 * @param elt The element with the attributes we're reading
 * @param obj The object to which we are writing
 * @returns {*}
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
 * Create a string transform from an object representation
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
 * Compute whether the bounding boxes of two elements intersect.
 * Note that type assertions would be correct, but slow down this code which tends to be called very frequently
 * in simulations and animations.
 *
 * @param elt1 An SVG or HTML element.
 * @param elt2 Another SVG or HTML element.
 * @returns {boolean} True if the elements bounding rectangle intersect, false otherwise.
 */
const intersectRect = (elt1, elt2) => {
  elt1 = elt1.getBoundingClientRect();
  elt2 = elt2.getBoundingClientRect();
  return !(elt2.left > elt1.right  ||
  elt2.top  > elt1.bottom ||
  elt1.left > elt2.right  ||
  elt1.top  > elt2.bottom);
};

/**
 * Compute whether the given point is contained within the list of points. This function has more than
 * a little voodoo.
 *
 * @param poly A list of points in {x,y} format, e.g. [{1,3},{0,-7},{23,-10}]
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

// export {scatter, gather, parseTransform, renderTransform, intersectRect, isPointInPoly};

// Ideas for testing.
// let radius = document.getElementsByClassName('radius')[0]
// let transform = SVG.parseTransform(radius)
// let transformString = SVG.renderTransform(transform)

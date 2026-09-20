# 3.4 Graphs of Polynomial Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/3-4-graphs-of-polynomial-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.4 Graphs of Polynomial Functions

### Learning Objectives

In this section, you will:

  * Recognize characteristics of graphs of polynomial functions.
  * Use factoring to ﬁnd zeros of polynomial functions.
  * Identify zeros and their multiplicities.
  * Determine end behavior.
  * Understand the relationship between degree and turning points.
  * Graph polynomial functions.
  * Use the Intermediate Value Theorem.

The revenue in millions of dollars for a fictional cable company from 2006 through 2013 is shown in [Table 1](<3-4-graphs-of-polynomial-functions#Table_03_04_01>)**.**

**Year** | 2006 | 2007 | 2008 | 2009 | 2010 | 2011 | 2012 | 2013  
---|---|---|---|---|---|---|---|---  
**Revenues** | 52.4 | 52.8 | 51.2 | 49.5 | 48.6 | 48.6 | 48.7 | 47.1  
  
Table  1

The revenue can be modeled by the polynomial function

R(t)=−0.037 t 4 +1.414 t 3 −19.777 t 2 +118.696t−205.332 R(t)=−0.037 t 4 +1.414 t 3 −19.777 t 2 +118.696t−205.332

where  R R represents the revenue in millions of dollars and  t t represents the year, with  t=6 t=6 corresponding to 2006. Over which intervals is the revenue for the company increasing? Over which intervals is the revenue for the company decreasing? These questions, along with many others, can be answered by examining the graph of the polynomial function. We have already explored the local behavior of quadratics, a special case of polynomials. In this section we will explore the local behavior of polynomials in general.

### Recognizing Characteristics of Graphs of Polynomial Functions

Polynomial functions of degree 2 or more have graphs that do not have sharp corners; recall that these types of graphs are called smooth curves. Polynomial functions also display graphs that have no breaks. Curves with no breaks are called continuous. [Figure 1](<3-4-graphs-of-polynomial-functions#Figure_03_04_001>) shows a graph that represents a polynomial function and a graph that represents a function that is not a polynomial.

![Graph of f\(x\)=x^3-0.01x.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f9fba078e008719dba07a824f3eae23ec230ecf0) Figure  1

###  Example  1

#### Recognizing Polynomial Functions

Which of the graphs in [Figure 2](<3-4-graphs-of-polynomial-functions#Figure_03_04_002>) represents a polynomial function?

![Two graphs in which one has a polynomial function and the other has a function closely resembling a polynomial but is not.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/81af91b4c8e5b551085812a381816964c2db604b) Figure  2

####  Solution

The graphs of  f f and  h h are graphs of polynomial functions. They are smooth and continuous.

The graphs of  g g and  k k are graphs of functions that are not polynomials. The graph of function  g g has a sharp corner. The graph of function  k k is not continuous.

###  Q&A

**Do all polynomial functions have as their domain all real numbers?**

_Yes. Any real number is a valid input for a polynomial function._

###  Using Factoring to Find Zeros of Polynomial Functions

Recall that if  f f is a polynomial function, the values of  x x for which  f( x )=0 f( x )=0 are called zeros of  f. f. If the equation of the polynomial function can be factored, we can set each factor equal to zero and solve for the zeros**.**

We can use this method to find  x- x- intercepts because at the  x- x- intercepts we find the input values when the output value is zero. For general polynomials, this can be a challenging prospect. While quadratics can be solved using the relatively simple quadratic formula, the corresponding formulas for cubic and fourth-degree polynomials are not simple enough to remember, and formulas do not exist for general higher-degree polynomials. Consequently, we will limit ourselves to three cases in this section:

  1. The polynomial can be factored using known methods: greatest common factor and trinomial factoring.
  2. The polynomial is given in factored form.
  3. Technology is used to determine the intercepts.

###  How To

**Given a polynomial function f, f, find the _x_ -intercepts by factoring.**

  1. Set  f( x )=0. f( x )=0.
  2. If the polynomial function is not given in factored form: 
     1. Factor out any common monomial factors.
     2. Factor any factorable binomials or trinomials.
  3. Set each factor equal to zero and solve to find the  x- x- intercepts.

###  Example  2

#### Finding the _x_ -Intercepts of a Polynomial Function by Factoring

Find the _x_ -intercepts of  f(x)= x 6 −3 x 4 +2 x 2 . f(x)= x 6 −3 x 4 +2 x 2 .

####  Solution

We can attempt to factor this polynomial to find solutions for  f( x )=0. f( x )=0.   
  

x 6 −3 x 4 +2 x 2 =0 Factor out the greatest common factor. x 2 ( x 4 −3 x 2 +2)=0 Factor the trinomial. x 2 ( x 2 −1)( x 2 −2)=0 Set each factor equal to zero. x 6 −3 x 4 +2 x 2 =0 Factor out the greatest common factor. x 2 ( x 4 −3 x 2 +2)=0 Factor the trinomial. x 2 ( x 2 −1)( x 2 −2)=0 Set each factor equal to zero.

( x 2 −1)=0 ( x 2 −2)=0 x 2 =0 or x 2 =1 or x 2 =2 x=0 x=±1 x=± 2 ( x 2 −1)=0 ( x 2 −2)=0 x 2 =0 or x 2 =1 or x 2 =2 x=0 x=±1 x=± 2

This gives us five  x- x- intercepts:  (0,0),(1,0),(−1,0),( 2 ,0), (0,0),(1,0),(−1,0),( 2 ,0), and  (− 2 ,0). (− 2 ,0). See [Figure 3](<3-4-graphs-of-polynomial-functions#Figure_03_04_003>). We can see that this is an even function.

![Four graphs where the first graph is of an even-degree polynomial, the second graph is of an absolute function, the third graph is an odd-degree polynomial, and the fourth graph is a disjoint function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/acfc71f62cb471ba6d03c56616826f9ad07dbacd) Figure  3

###  Example  3

#### Finding the _x_ -Intercepts of a Polynomial Function by Factoring

Find the  x- x- intercepts of  f(x)= x 3 −5 x 2 −x+5. f(x)= x 3 −5 x 2 −x+5.

####  Solution

Find solutions for  f(x)=0 f(x)=0 by factoring.  

x 3 −5 x 2 −x+5=0 Factor by grouping. x 2 (x−5)−(x−5)=0 Factor out the common factor. ( x 2 −1)(x−5)=0 Factor the difference of squares. (x+1)(x−1)(x−5)=0 Set each factor equal to zero. x 3 −5 x 2 −x+5=0 Factor by grouping. x 2 (x−5)−(x−5)=0 Factor out the common factor. ( x 2 −1)(x−5)=0 Factor the difference of squares. (x+1)(x−1)(x−5)=0 Set each factor equal to zero.

x+1=0 or x−1=0 or x−5=0 x=−1 x=1 x=5 x+1=0 or x−1=0 or x−5=0 x=−1 x=1 x=5

There are three  x- x- intercepts:  (−1,0),(1,0), (−1,0),(1,0), and  ( 5,0 ). ( 5,0 ). See [Figure 4](<3-4-graphs-of-polynomial-functions#Figure_03_04_004>).

![Graph of f\(x\)=x^6-3x^4+2x^2 with its five intercepts, \(-sqrt\(2\), 0\), \(-1, 0\), \(0, 0\), \(1, 0\), and \(sqrt\(2\), 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fe61d4a2221ab3c9b75cbea781f608c93f5c26b4) Figure  4

###  Example  4

#### Finding the _y_ \- and _x_ -Intercepts of a Polynomial in Factored Form

Find the  y- y- and _x_ -intercepts of  g(x)= (x−2) 2 (2x+3). g(x)= (x−2) 2 (2x+3).

####  Solution

The _y_ -intercept can be found by evaluating  g( 0 ). g( 0 ).

g(0)= (0−2) 2 (2(0)+3) =12 g(0)= (0−2) 2 (2(0)+3) =12

So the _y_ -intercept is  (0,12). (0,12).

The _x_ -intercepts can be found by solving  g( x )=0. g( x )=0.

(x−2) 2 (2x+3)=0 (x−2) 2 (2x+3)=0

(x−2) 2 =0 (2x+3)=0 x−2=0 or x=− 3 2 x=2 (x−2) 2 =0 (2x+3)=0 x−2=0 or x=− 3 2 x=2

So the  x- x- intercepts are  (2,0) (2,0) and  ( − 3 2 ,0 ). ( − 3 2 ,0 ).

#### Analysis 

We can always check that our answers are reasonable by using a graphing calculator to graph the polynomial as shown in [Figure 5](<3-4-graphs-of-polynomial-functions#Figure_03_04_005>).

![Graph of f\(x\)=x^3-5x^2-x+5 with its three intercepts \(-1, 0\), \(1, 0\), and \(5, 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ccac1104e77ba00cd9f6ffe92d30082011dafaf8) Figure  5

###  Example  5

#### Finding the _x_ -Intercepts of a Polynomial Function Using a Graph

Find the  x- x- intercepts of  h(x)= x 3 +4 x 2 +x−6. h(x)= x 3 +4 x 2 +x−6.

####  Solution

This polynomial is not in factored form, has no common factors, and does not appear to be factorable using techniques previously discussed. Fortunately, we can use technology to find the intercepts. Keep in mind that some values make graphing difficult by hand. In these cases, we can take advantage of graphing utilities.

Looking at the graph of this function, as shown in [Figure 6](<3-4-graphs-of-polynomial-functions#Figure_03_04_006>), it appears that there are _x_ -intercepts at  x=−3,−2, x=−3,−2, and  1. 1.

![Graph of g\(x\)=\(x-2\)^2\(2x+3\) with its two x-intercepts \(2, 0\) and \(-3/2, 0\) and its y-intercept \(0, 12\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/026e77f88f0dd9323979ed6006f4239b490ef58a) Figure  6

We can check whether these are correct by substituting these values for  x x and verifying that

h(−3)=h(−2)=h(1)=0. h(−3)=h(−2)=h(1)=0.

Since  h(x)= x 3 +4 x 2 +x−6, h(x)= x 3 +4 x 2 +x−6, we have:

h(−3)= (−3) 3 +4 (−3) 2 +(−3)−6=−27+36−3−6=0 h(−2)= (−2) 3 +4 (−2) 2 +(−2)−6=−8+16−2−6=0 h(1)= (1) 3 +4 (1) 2 +(1)−6=1+4+1−6=0 h(−3)= (−3) 3 +4 (−3) 2 +(−3)−6=−27+36−3−6=0 h(−2)= (−2) 3 +4 (−2) 2 +(−2)−6=−8+16−2−6=0 h(1)= (1) 3 +4 (1) 2 +(1)−6=1+4+1−6=0

Each  x- x- intercept corresponds to a zero of the polynomial function and each zero yields a factor, so we can now write the polynomial in factored form.

h(x)= x 3 +4 x 2 +x−6 =(x+3)(x+2)(x−1) h(x)= x 3 +4 x 2 +x−6 =(x+3)(x+2)(x−1)

###  Try It  #1

Find the  y- y- and _x_ -intercepts of the function  f(x)= x 4 −19 x 2 +30x. f(x)= x 4 −19 x 2 +30x.

### Identifying Zeros and Their Multiplicities

Graphs behave differently at various  x- x- intercepts. Sometimes, the graph will cross over the horizontal axis at an intercept. Other times, the graph will touch the horizontal axis and bounce off. 

Suppose, for example, we graph the function

f(x)=(x+3) (x−2) 2 (x+1) 3 . f(x)=(x+3) (x−2) 2 (x+1) 3 .

Notice in [Figure 7](<3-4-graphs-of-polynomial-functions#Figure_03_04_007>) that the behavior of the function at each of the  x- x- intercepts is different.

![Graph of h\(x\)=x^3+4x^2+x-6.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ce92d93b8ff381a7275e4012fe36713dab6f6f7a) Figure  7 Identifying the behavior of the graph at an _x_ -intercept by examining the multiplicity of the zero.

The  x- x- intercept  −3 −3 is the solution of equation  (x+3)=0. (x+3)=0. The graph passes directly through the  x- x- intercept at  x=−3. x=−3. The factor is linear (has a degree of 1), so the behavior near the intercept is like that of a line—it passes directly through the intercept. We call this a single zero because the zero corresponds to a single factor of the function.

The  x- x- intercept  2  2  is the repeated solution of equation  (x−2) 2 =0. (x−2) 2 =0. The graph touches the axis at the intercept and changes direction. The factor is quadratic (degree 2), so the behavior near the intercept is like that of a quadratic—it bounces off of the horizontal axis at the intercept.

(x−2) 2 =(x−2)(x−2) (x−2) 2 =(x−2)(x−2)

The factor is repeated, that is, the factor  ( x−2 ) ( x−2 ) appears twice. The number of times a given factor appears in the factored form of the equation of a polynomial is called the multiplicity. The zero associated with this factor,  x=2, x=2, has multiplicity 2 because the factor  ( x−2 ) ( x−2 ) occurs twice.

The  x- x- intercept  −1 −1 is the repeated solution of factor  (x+1) 3 =0. (x+1) 3 =0. The graph passes through the axis at the intercept, but flattens out a bit first. This factor is cubic (degree 3), so the behavior near the intercept is like that of a cubic—with the same S-shape near the intercept as the toolkit function  f( x )= x 3 . f( x )= x 3 . We call this a triple zero, or a zero with multiplicity 3.

For zeros with even multiplicities, the graphs _touch_ or are tangent to the  x- x- axis. For zeros with odd multiplicities, the graphs _cross_ or intersect the  x- x- axis. See [Figure 8](<3-4-graphs-of-polynomial-functions#Figure_03_04_008>) for examples of graphs of polynomial functions with multiplicity 1, 2, and 3.

![Graph of f\(x\)=\(x+3\)\(x-2\)^2\(x+1\)^3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/404d5117e8c2b2cc187c001d0fcf267e8d3c7bbf) Figure  8

For higher even powers, such as 4, 6, and 8, the graph will still touch and bounce off of the horizontal axis but, for each increasing even power, the graph will appear flatter as it approaches and leaves the  x- x- axis.

For higher odd powers, such as 5, 7, and 9, the graph will still cross through the horizontal axis, but for each increasing odd power, the graph will appear flatter as it approaches and leaves the  x- x- axis.

###  Graphical Behavior of Polynomials at  x- x- Intercepts

If a polynomial contains a factor of the form  (x−h) p , (x−h) p , the behavior near the  x- x- intercept  h h is determined by the power  p. p. We say that  x=h x=h is a zero of multiplicity p. p.

The graph of a polynomial function will touch the  x- x- axis at zeros with even multiplicities. The graph will cross the _x_ -axis at zeros with odd multiplicities.

The sum of the multiplicities is the degree of the polynomial function.

###  How To

**Given a graph of a polynomial function of degree** n, n, **identify the zeros and their multiplicities.**

  1. If the graph crosses the _x_ -axis and appears almost linear at the intercept, it is a single zero.
  2. If the graph touches the _x_ -axis and bounces off of the axis, it is a zero with even multiplicity.
  3. If the graph crosses the _x_ -axis at a zero, it is a zero with odd multiplicity.
  4. The sum of the multiplicities is  n. n.

###  Example  6

#### Identifying Zeros and Their Multiplicities

Use the graph of the function of degree 6 in [Figure 9](<3-4-graphs-of-polynomial-functions#Figure_03_04_009>) to identify the zeros of the function and their possible multiplicities.

![Three graphs showing three different polynomial functions with multiplicity 1, 2, and 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e8a752c0135fc06281f53be9059808067c0466a2) Figure  9

####  Solution

The polynomial function is of degree  n. n. The sum of the multiplicities must be  n. n.

Starting from the left, the first zero occurs at  x=−3. x=−3. The graph touches the _x_ -axis, so the multiplicity of the zero must be even. The zero of  −3 −3 has multiplicity  2. 2.

The next zero occurs at  x=−1. x=−1. The graph looks almost linear at this point. This is a single zero of multiplicity 1.

The last zero occurs at  x=4. x=4. The graph crosses the _x_ -axis, so the multiplicity of the zero must be odd. We know that the multiplicity is likely 3 and that the sum of the multiplicities is likely 6.

###  Try It  #2

Use the graph of the function of degree 7 in [Figure 10](<3-4-graphs-of-polynomial-functions#Figure_03_04_010>) to identify the zeros of the function and their multiplicities.

![Graph of an even-degree polynomial with degree 6.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/269827c6c7b43d714bed10057acdea69772a159e) Figure  10

### Determining End Behavior

As we have already learned, the behavior of a graph of a polynomial function of the form

f(x)= a n x n + a n−1 x n−1 +...+ a 1 x+ a 0 f(x)= a n x n + a n−1 x n−1 +...+ a 1 x+ a 0

will either ultimately rise or fall as  x x increases without bound and will either rise or fall as  x x decreases without bound. This is because for very large inputs, say 100 or 1,000, the leading term dominates the size of the output. The same is true for very small inputs, say –100 or –1,000.

Recall that we call this behavior the _end behavior_ of a function. As we pointed out when discussing quadratic equations, when the leading term of a polynomial function,  a n x n , a n x n , is an even power function, as  x x increases or decreases without bound,  f(x) f(x) increases without bound. When the leading term is an odd power function, as  x x decreases without bound,  f(x) f(x) also decreases without bound; as  x x increases without bound,  f(x) f(x) also increases without bound. If the leading term is negative, it will change the direction of the end behavior. [Figure 11](<3-4-graphs-of-polynomial-functions#Figure_03_04_011abcd>) summarizes all four cases.

![Graph of a polynomial function with degree 5.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/28414464e400c586d74e5bec5d07e7fdfd82cc13) Figure  11

###  Understanding the Relationship between Degree and Turning Points

In addition to the end behavior, recall that we can analyze a polynomial function’s local behavior. It may have a turning point where the graph changes from increasing to decreasing (rising to falling) or decreasing to increasing (falling to rising). Look at the graph of the polynomial function  f(x)= x 4 − x 3 −4 x 2 +4x f(x)= x 4 − x 3 −4 x 2 +4x in [Figure 12](<3-4-graphs-of-polynomial-functions#Figure_03_04_015>). The graph has three turning points.

![Graph of an odd-degree polynomial with a negative leading coefficient. Note that as x goes to positive infinity, f\(x\) goes to negative infinity, and as x goes to negative infinity, f\(x\) goes to positive infinity.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/432f04460f582f5ed3937f2c6d9840bf1a042167) Figure  12

This function  f f is a 4th degree polynomial function and has 3 turning points. The maximum number of turning points of a polynomial function is always one less than the degree of the function.

###  Interpreting Turning Points

A turning point is a point of the graph where the graph changes from increasing to decreasing (rising to falling) or decreasing to increasing (falling to rising).

A polynomial of degree  n n will have at most  n−1 n−1 turning points.

###  Example  7

#### Finding the Maximum Number of Turning Points Using the Degree of a Polynomial Function

Find the maximum number of turning points of each polynomial function.

  1. ⓐ f(x)=− x 3 +4 x 5 −3 x 2 +1 f(x)=− x 3 +4 x 5 −3 x 2 +1
  2. ⓑ f(x)=− ( x−1 ) 2 ( 1+2 x 2 ) f(x)=− ( x−1 ) 2 ( 1+2 x 2 )

####  Solution

  1. ⓐ f(x)=−x + 3 4 x 5 −3 x 2 +1 f(x)=−x + 3 4 x 5 −3 x 2 +1

First, rewrite the polynomial function in descending order:  f(x)=4 x 5 − x 3 −3 x 2 +1 f(x)=4 x 5 − x 3 −3 x 2 +1

Identify the degree of the polynomial function. This polynomial function is of degree 5.

The maximum number of turning points is  5−1=4. 5−1=4.

  2. ⓑ f(x)=− ( x−1 ) 2 ( 1+2 x 2 ) f(x)=− ( x−1 ) 2 ( 1+2 x 2 )

First, identify the leading term of the polynomial function if the function were expanded.

![Graph of f\(x\)=x^4-x^3-4x^2+4x which denotes where the function increases and decreases and its turning points.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fe6d6992ca770acf450f62c740c5ab61eb32a253)

Then, identify the degree of the polynomial function. This polynomial function is of degree 4.

The maximum number of turning points is  4−1=3. 4−1=3.

### Graphing Polynomial Functions

We can use what we have learned about multiplicities, end behavior, and turning points to sketch graphs of polynomial functions. Let us put this all together and look at the steps required to graph polynomial functions.

###  How To

**Given a polynomial function, sketch the graph.**

  1. Find the intercepts.
  2. Check for symmetry. If the function is an even function, its graph is symmetrical about the  y- y- axis, that is,  f( −x )=f( x ). f( −x )=f( x ). If a function is an odd function, its graph is symmetrical about the origin, that is,  f( −x )=−f( x ). f( −x )=−f( x ).
  3. Use the multiplicities of the zeros to determine the behavior of the polynomial at the  x- x- intercepts.
  4. Determine the end behavior by examining the leading term.
  5. Use the end behavior and the behavior at the intercepts to sketch a graph.
  6. Ensure that the number of turning points does not exceed one less than the degree of the polynomial.
  7. Optionally, use technology to check the graph.

###  Example  8

#### Sketching the Graph of a Polynomial Function

Sketch a graph of  f(x)=−2 (x+3) 2 (x−5). f(x)=−2 (x+3) 2 (x−5).

####  Solution

This graph has two  x- x- intercepts. At  x=−3, x=−3, the factor is squared, indicating a multiplicity of 2. The graph will bounce at this  x- x- intercept. At  x=5, x=5, the function has a multiplicity of one, indicating the graph will cross through the axis at this intercept.

The _y_ -intercept is found by evaluating  f(0). f(0).

f(0)=−2 (0+3) 2 (0−5) =−2⋅9⋅(−5) =90 f(0)=−2 (0+3) 2 (0−5) =−2⋅9⋅(−5) =90

The  y- y- intercept is  (0,90). (0,90).

Additionally, we can see the leading term, if this polynomial were multiplied out, would be  −2 x 3 , −2 x 3 , so the end behavior is that of a vertically reflected cubic, with the outputs decreasing as the inputs approach infinity, and the outputs increasing as the inputs approach negative infinity. See [Figure 13](<3-4-graphs-of-polynomial-functions#Figure_03_04_017>).

![Showing the distribution for the leading term.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f71faa8330474b6b26902b22c6c6997e55406854) Figure  13

To sketch this, we consider that:

  * As  x→−∞ x→−∞ the function  f(x)→∞, f(x)→∞, so we know the graph starts in the second quadrant and is decreasing toward the  x- x- axis.
  * Since  f( −x )=−2 ( −x+3 ) 2 ( −x–5 ) f( −x )=−2 ( −x+3 ) 2 ( −x–5 ) is not equal to  f( x ), f( x ), the graph does not display symmetry.
  * At  ( −3,0 ), ( −3,0 ), the graph bounces off of the  x- x- axis, so the function must start increasing.

At  ( 0,90 ), ( 0,90 ), the graph crosses the  y- y- axis at the  y- y- intercept. See [Figure 14](<3-4-graphs-of-polynomial-functions#Figure_03_04_018>).

![Graph of the end behavior and intercepts, \(-3, 0\) and \(0, 90\), for the function f\(x\)=-2\(x+3\)^2\(x-5\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/be18445d119a42592faaea51ef2fb44255d22f02) Figure  14

Somewhere after this point, the graph must turn back down or start decreasing toward the horizontal axis because the graph passes through the next intercept at  ( 5,0 ). ( 5,0 ). See [Figure 15](<3-4-graphs-of-polynomial-functions#Figure_03_04_019>).

![Graph of the end behavior and intercepts, \(-3, 0\), \(0, 90\) and \(5, 0\), for the function f\(x\)=-2\(x+3\)^2\(x-5\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b331d18a2cbfecc393b46db4477fc7d15eb81774) Figure  15

As  x→∞ x→∞ the function  f(x)→−∞, f(x)→−∞, so we know the graph continues to decrease, and we can stop drawing the graph in the fourth quadrant.

Using technology, we can create the graph for the polynomial function, shown in [Figure 16](<3-4-graphs-of-polynomial-functions#Figure_03_04_020>), and verify that the resulting graph looks like our sketch in [Figure 15](<3-4-graphs-of-polynomial-functions#Figure_03_04_019>).

![Graph of f\(x\)=-2\(x+3\)^2\(x-5\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1cbdf4b7ee0d0b17d6ff665231879e6b22814de5) Figure  16 The complete graph of the polynomial function  f(x)=−2 (x+3) 2 (x−5) f(x)=−2 (x+3) 2 (x−5)

###  Try It  #3

Sketch a graph of  f(x)= 1 4 x (x−1) 4 (x+3) 3 . f(x)= 1 4 x (x−1) 4 (x+3) 3 .

### Using the Intermediate Value Theorem

In some situations, we may know two points on a graph but not the zeros. If those two points are on opposite sides of the _x_ -axis, we can confirm that there is a zero between them. Consider a polynomial function  f f whose graph is smooth and continuous. The **Intermediate Value Theorem** states that for two numbers  a a and  b b in the domain of  f, f, if  a<b a<b and  f( a )≠f( b ), f( a )≠f( b ), then the function  f f takes on every value between  f( a ) f( a ) and  f( b ). f( b ). We can apply this theorem to a special case that is useful in graphing polynomial functions. If a point on the graph of a continuous function  f f at  x=a x=a lies above the  x- x- axis and another point at  x=b x=b lies below the  x- x- axis, there must exist a third point between  x=a x=a and  x=b x=b where the graph crosses the  x- x- axis. Call this point  ( c,f( c ) ). ( c,f( c ) ). This means that we are assured there is a solution  c c where  f( c )=0. f( c )=0.

In other words, the Intermediate Value Theorem tells us that when a polynomial function changes from a negative value to a positive value, the function must cross the  x- x- axis. [Figure 17](<3-4-graphs-of-polynomial-functions#Figure_03_04_022>) shows that there is a zero between  a a and  b. b.

![Graph of an odd-degree polynomial function that shows a point f\(a\) that’s negative, f\(b\) that’s positive, and f\(c\) that’s 0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9538198bf88e09fa5229c8ffbde855255cbbe56b) Figure  17 Using the Intermediate Value Theorem to show there exists a zero.

###  Intermediate Value Theorem

Let  f f be a polynomial function. The Intermediate Value Theorem states that if  f( a ) f( a ) and  f( b ) f( b ) have opposite signs, then there exists at least one value  c c between  a a and  b b for which  f( c )=0. f( c )=0.

###  Example  9

#### Using the Intermediate Value Theorem

Show that the function  f(x)= x 3 −5 x 2 +3x+6 f(x)= x 3 −5 x 2 +3x+6 has at least two real zeros between  x=1 x=1 and  x=4. x=4.

####  Solution

As a start, evaluate  f(x) f(x) at the integer values  x=1,2,3,and4. x=1,2,3,and4. See [Table 2](<3-4-graphs-of-polynomial-functions#Table_03_04_03>).

** x x ** | 1 | 2 | 3 | 4  
---|---|---|---|---  
** f(x) f(x) ** | 5 | 0 | –3 | 2  
  
Table  2

We see that one zero occurs at  x=2. x=2. Also, since  f(3) f(3) is negative and  f(4) f(4) is positive, by the Intermediate Value Theorem, there must be at least one real zero between 3 and 4.

We have shown that there are at least two real zeros between  x=1 x=1 and  x=4. x=4.

#### Analysis 

We can also see on the graph of the function in [Figure 18](<3-4-graphs-of-polynomial-functions#Figure_03_04_023>) that there are two real zeros between  x=1 x=1 and  x=4. x=4.

![Graph of f\(x\)=x^3-5x^2+3x+6 and shows, by the Intermediate Value Theorem, that there exists two zeros since f\(1\)=5  and f\(4\)=2 are positive and f\(3\) = -3 is negative.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/bda6c45202b2dba1bb5a1716b1f22ba3cb251961) Figure  18

###  Try It  #4

Show that the function  f(x)=7 x 5 −9 x 4 − x 2 f(x)=7 x 5 −9 x 4 − x 2 has at least one real zero between  x=1 x=1 and  x=2. x=2.

####  Writing Formulas for Polynomial Functions

Now that we know how to find zeros of polynomial functions, we can use them to write formulas based on graphs. Because a polynomial function written in factored form will have an  x- x- intercept where each factor is equal to zero, we can form a function that will pass through a set of  x- x- intercepts by introducing a corresponding set of factors.

###  Factored Form of Polynomials

If a polynomial of lowest degree  p p has horizontal intercepts at  x= x 1 , x 2 ,…, x n , x= x 1 , x 2 ,…, x n , then the polynomial can be written in the factored form:  f(x)=a (x− x 1 ) p 1 (x− x 2 ) p 2 ⋯ (x− x n ) p n f(x)=a (x− x 1 ) p 1 (x− x 2 ) p 2 ⋯ (x− x n ) p n where the powers  p i p i on each factor can be determined by the behavior of the graph at the corresponding intercept, and the stretch factor  a a can be determined given a value of the function other than the _x_ -intercept.

###  How To

**Given a graph of a polynomial function, write a formula for the function.**

  1. Identify the _x_ -intercepts of the graph to find the factors of the polynomial.
  2. Examine the behavior of the graph at the _x_ -intercepts to determine the multiplicity of each factor.
  3. Find the polynomial of least degree containing all the factors found in the previous step.
  4. Use any other point on the graph (the _y_ -intercept may be easiest) to determine the stretch factor.

###  Example  10

#### Writing a Formula for a Polynomial Function from the Graph

Write a formula for the polynomial function shown in [Figure 19](<3-4-graphs-of-polynomial-functions#Figure_03_04_024>).

![Graph of a positive even-degree polynomial with zeros at x=-3, 2, 5 and y=-2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2d9f67efa962ccfde6f63f6e01f5e4c157694cbc) Figure  19

####  Solution

This graph has three  x- x- intercepts:  x=−3,2, x=−3,2, and  5. 5. The  y- y- intercept is located at  (0,−2). (0,−2). At  x=−3 x=−3 and  x=5, x=5, the graph passes through the axis linearly, suggesting the corresponding factors of the polynomial will be linear. At  x=2, x=2, the graph bounces at the intercept, suggesting the corresponding factor of the polynomial will be second degree (quadratic). Together, this gives us

f(x)=a(x+3) (x−2) 2 (x−5) f(x)=a(x+3) (x−2) 2 (x−5)

To determine the stretch factor, we utilize another point on the graph. We will use the  y- y- intercept  (0,–2), (0,–2), to solve for  a. a.

f(0)=a(0+3) (0−2) 2 (0−5) −2=a(0+3) (0−2) 2 (0−5) −2=−60a a= 1 30 f(0)=a(0+3) (0−2) 2 (0−5) −2=a(0+3) (0−2) 2 (0−5) −2=−60a a= 1 30

The graphed polynomial appears to represent the function  f(x)= 1 30 (x+3) (x−2) 2 (x−5). f(x)= 1 30 (x+3) (x−2) 2 (x−5).

###  Try It  #5

Given the graph shown in [Figure 20](<3-4-graphs-of-polynomial-functions#Figure_03_04_025>), write a formula for the function shown.

![Graph of a negative even-degree polynomial with zeros at x=-1, 2, 4 and y=-4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d1ed7252fe52a4e84b4660533434e16b11f3f3ab) Figure  20

#### Using Local and Global Extrema

With quadratics, we were able to algebraically find the maximum or minimum value of the function by finding the vertex. For general polynomials, finding these turning points is not possible without more advanced techniques from calculus. Even then, finding where extrema occur can still be algebraically challenging. For now, we will estimate the locations of turning points using technology to generate a graph.

Each turning point represents a local minimum or maximum. Sometimes, a turning point is the highest or lowest point on the entire graph. In these cases, we say that the turning point is a **global maximum** or a **global minimum**. These are also referred to as the absolute maximum and absolute minimum values of the function.

###  Local and Global Extrema

A local maximum or local minimum at  x=a x=a (sometimes called the relative maximum or minimum, respectively) is the output at the highest or lowest point on the graph in an open interval around  x=a. x=a. If a function has a local maximum at  a, a, then  f(a)≥f(x) f(a)≥f(x) for all  x x in an open interval around  x=a. x=a. If a function has a local minimum at  a, a, then  f(a)≤f(x) f(a)≤f(x) for all  x x in an open interval around  x=a. x=a.

A global maximum or global minimum is the output at the highest or lowest point of the function. If a function has a global maximum at  a, a, then  f(a)≥f(x) f(a)≥f(x) for all  x. x. If a function has a global minimum at  a, a, then  f(a)≤f(x) f(a)≤f(x) for all  x. x.

We can see the difference between local and global extrema in [Figure 21](<3-4-graphs-of-polynomial-functions#Figure_03_04_026>).

![Graph of an even-degree polynomial that denotes the local maximum and minimum and the global maximum.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/949df3cc47247d1bb8a262ff0181d0ead4f5a1f2) Figure  21

###  Q&A

**Do all polynomial functions have a global minimum or maximum?**

_No. Only polynomial functions of even degree have a global minimum or maximum. For example, f( x )=x f( x )=x has neither a global maximum nor a global minimum._

###  Example  11

#### Using Local Extrema to Solve Applications

An open-top box is to be constructed by cutting out squares from each corner of a 14 cm by 20 cm sheet of plastic then folding up the sides. Find the size of squares that should be cut out to maximize the volume enclosed by the box.

####  Solution

We will start this problem by drawing a picture like that in [Figure 22](<3-4-graphs-of-polynomial-functions#Figure_03_04_027>), labeling the width of the cut-out squares with a variable,  w. w.

![Diagram of a rectangle with four squares at the corners.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/638d020e2dfe56a85ba706424bf66165668ebe9b) Figure  22

Notice that after a square is cut out from each end, it leaves a  ( 14−2w ) ( 14−2w ) cm by  ( 20−2w ) ( 20−2w ) cm rectangle for the base of the box, and the box will be  w w cm tall. This gives the volume

V(w)=(20−2w)(14−2w)w =280w−68 w 2 +4 w 3 V(w)=(20−2w)(14−2w)w =280w−68 w 2 +4 w 3

Notice, since the factors are  w, w, 20–2w 20–2w and  14–2w, 14–2w, the three zeros are 10, 7, and 0, respectively. Because a height of 0 cm is not reasonable, we consider the only the zeros 10 and 7. The shortest side is 14 and we are cutting off two squares, so values  w w may take on are greater than zero or less than 7. This means we will restrict the domain of this function to  0<w<7. 0<w<7. Using technology to sketch the graph of  V( w ) V( w ) on this reasonable domain, we get a graph like that in [Figure 23](<3-4-graphs-of-polynomial-functions#Figure_03_04_028>). We can use this graph to estimate the maximum value for the volume, restricted to values for  w w that are reasonable for this problem—values from 0 to 7.

![Graph of V\(w\)=\(20-2w\)\(14-2w\)w where the x-axis is labeled w and the y-axis is labeled V\(w\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/19ed11d35be686288f9279f5f4e387c1243d4de1) Figure  23

From this graph, we turn our focus to only the portion on the reasonable domain,  [ 0,7 ]. [ 0,7 ]. We can estimate the maximum value to be around 340 cubic cm, which occurs when the squares are about 2.75 cm on each side. To improve this estimate, we could use advanced features of our technology, if available, or simply change our window to zoom in on our graph to produce [Figure 24](<3-4-graphs-of-polynomial-functions#Figure_03_04_029>).

![Graph of V\(w\)=\(20-2w\)\(14-2w\)w where the x-axis is labeled w and the y-axis is labeled V\(w\) on the domain \[2.4, 3\].](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/60b58b6713a682bd456abdf1ee3740e5811b8b5c) Figure  24

From this zoomed-in view, we can refine our estimate for the maximum volume to about 339 cubic cm, when the squares measure approximately 2.7 cm on each side.

###  Try It  #6

Use technology to find the maximum and minimum values on the interval  [−1,4] [−1,4] of the function  f(x)=−0.2 (x−2) 3 (x+1) 2 (x−4). f(x)=−0.2 (x−2) 3 (x+1) 2 (x−4).

###  Media

Access the following online resource for additional instruction and practice with graphing polynomial functions.

  * [Intermediate Value Theorem](<http://openstax.org/l/ivt>)

###  3.4 Section Exercises

#### Verbal

[1](<chapter-3>). 

What is the difference between an  x- x- intercept and a zero of a polynomial function  f? f?

2. 

If a polynomial function of degree  n n has  n n distinct zeros, what do you know about the graph of the function?

[3](<chapter-3>). 

Explain how the Intermediate Value Theorem can assist us in finding a zero of a function.

4. 

Explain how the factored form of the polynomial helps us in graphing it.

[5](<chapter-3>). 

If the graph of a polynomial just touches the  x- x- axis and then changes direction, what can we conclude about the factored form of the polynomial?

#### Algebraic

For the following exercises, find the  x- x- or _t_ -intercepts of the polynomial functions.

6. 

C( t )=2( t−4 )( t+1 )(t−6) C( t )=2( t−4 )( t+1 )(t−6)

[7](<chapter-3>). 

C( t )=3( t+2 )( t−3 )(t+5) C( t )=3( t+2 )( t−3 )(t+5)

8. 

C( t )=4t ( t−2 ) 2 (t+1) C( t )=4t ( t−2 ) 2 (t+1)

[9](<chapter-3>). 

C( t )=2t( t−3 ) ( t+1 ) 2 C( t )=2t( t−3 ) ( t+1 ) 2

10. 

C( t )=2 t 4 −8 t 3 +6 t 2 C( t )=2 t 4 −8 t 3 +6 t 2

[11](<chapter-3>). 

C( t )=4 t 4 +12 t 3 −40 t 2 C( t )=4 t 4 +12 t 3 −40 t 2

12. 

f(x)= x 4 − x 2 f(x)= x 4 − x 2

[13](<chapter-3>). 

f(x)= x 3 + x 2 −20x f(x)= x 3 + x 2 −20x

14. 

f(x)= x 3 +6 x 2 −7x f(x)= x 3 +6 x 2 −7x

[15](<chapter-3>). 

f(x)= x 3 + x 2 −4x−4 f(x)= x 3 + x 2 −4x−4

16. 

f(x)= x 3 +2 x 2 −9x−18 f(x)= x 3 +2 x 2 −9x−18

[17](<chapter-3>). 

f(x)=2 x 3 − x 2 −8x+4 f(x)=2 x 3 − x 2 −8x+4

18. 

f(x)= x 6 −7 x 3 −8 f(x)= x 6 −7 x 3 −8

[19](<chapter-3>). 

f(x)=2 x 4 +6 x 2 −8 f(x)=2 x 4 +6 x 2 −8

20. 

f(x)= x 3 −3 x 2 −x+3 f(x)= x 3 −3 x 2 −x+3

[21](<chapter-3>). 

f(x)= x 6 −2 x 4 −3 x 2 f(x)= x 6 −2 x 4 −3 x 2

22. 

f(x)= x 6 −3 x 4 −4 x 2 f(x)= x 6 −3 x 4 −4 x 2

[23](<chapter-3>). 

f(x)= x 5 −5 x 3 +4x f(x)= x 5 −5 x 3 +4x

For the following exercises, use the Intermediate Value Theorem to confirm that the given polynomial has at least one zero within the given interval.

24. 

f(x)= x 3 −9x, f(x)= x 3 −9x, between  x=−4 x=−4 and  x=−2. x=−2.

[25](<chapter-3>). 

f(x)= x 3 −9x, f(x)= x 3 −9x, between  x=2 x=2 and  x=4. x=4.

26. 

f(x)= x 5 −2x, f(x)= x 5 −2x, between  x=1 x=1 and  x=2. x=2.

[27](<chapter-3>). 

f(x)=− x 4 +4, f(x)=− x 4 +4, between  x=1 x=1 and  x=3 x=3 .

28. 

f(x)=−2 x 3 −x, f(x)=−2 x 3 −x, between  x=–1 x=–1 and  x=1. x=1.

[29](<chapter-3>). 

f(x)= x 3 −100x+2, f(x)= x 3 −100x+2, between  x=0.01 x=0.01 and  x=0.1 x=0.1

For the following exercises, find the zeros and give the multiplicity of each.

30. 

f(x)= ( x+2 ) 3 ( x−3 ) 2 f(x)= ( x+2 ) 3 ( x−3 ) 2

[31](<chapter-3>). 

f(x)= x 2 ( 2x+3 ) 5 ( x−4 ) 2 f(x)= x 2 ( 2x+3 ) 5 ( x−4 ) 2

32. 

f(x)= x 3 ( x−1 ) 3 ( x+2 ) f(x)= x 3 ( x−1 ) 3 ( x+2 )

[33](<chapter-3>). 

f(x)= x 2 ( x 2 +4x+4 ) f(x)= x 2 ( x 2 +4x+4 )

34. 

f(x)= ( 2x+1 ) 3 ( 9 x 2 −6x+1 ) f(x)= ( 2x+1 ) 3 ( 9 x 2 −6x+1 )

[35](<chapter-3>). 

f(x)= ( 3x+2 ) 5 ( x 2 −10x+25 ) f(x)= ( 3x+2 ) 5 ( x 2 −10x+25 )

36. 

f(x)=x( 4 x 2 −12x+9 )( x 2 +8x+16 ) f(x)=x( 4 x 2 −12x+9 )( x 2 +8x+16 )

[37](<chapter-3>). 

f(x)= x 6 − x 5 −2 x 4 f(x)= x 6 − x 5 −2 x 4

38. 

f(x)=3 x 4 +6 x 3 +3 x 2 f(x)=3 x 4 +6 x 3 +3 x 2

[39](<chapter-3>). 

f(x)=4 x 5 −12 x 4 +9 x 3 f(x)=4 x 5 −12 x 4 +9 x 3

40. 

f(x)=2 x 4 ( x 3 −4 x 2 +4x ) f(x)=2 x 4 ( x 3 −4 x 2 +4x )

[41](<chapter-3>). 

f(x)=4 x 4 ( 9 x 4 −12 x 3 +4 x 2 ) f(x)=4 x 4 ( 9 x 4 −12 x 3 +4 x 2 )

#### Graphical

For the following exercises, graph the polynomial functions. Note  x- x- and  y- y- intercepts, multiplicity, and end behavior.

42. 

f( x )= ( x+3 ) 2 (x−2) f( x )= ( x+3 ) 2 (x−2)

[43](<chapter-3>). 

g( x )=( x+4 ) ( x−1 ) 2 g( x )=( x+4 ) ( x−1 ) 2

44. 

h( x )= ( x−1 ) 3 ( x+3 ) 2 h( x )= ( x−1 ) 3 ( x+3 ) 2

[45](<chapter-3>). 

k( x )= ( x−3 ) 3 ( x−2 ) 2 k( x )= ( x−3 ) 3 ( x−2 ) 2

46. 

m( x )=−2x( x−1 )(x+3) m( x )=−2x( x−1 )(x+3)

[47](<chapter-3>). 

n( x )=−3x( x+2 )(x−4) n( x )=−3x( x+2 )(x−4)

For the following exercises, use the graphs to write the formula for a polynomial function of least degree.

48. 

![Graph of a positive odd-degree polynomial with zeros at x=-2, 1, and 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6d35101abf136d3b2bd9c5343758e18f328c8293)

[49](<chapter-3>). 

![Graph of a negative odd-degree polynomial with zeros at x=-3, 1, and 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/430a35901210322268bed021d50f9455fda61041)

50. 

![Graph of a negative odd-degree polynomial with zeros at x=-1, and 2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3f52bd904e33273b827881b334c2584318788a79)

[51](<chapter-3>). 

![Graph of a positive odd-degree polynomial with zeros at x=-2, and 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c1d36636f5704a56eedad95516fff134daacdd4c)

52. 

![Graph of a negative even-degree polynomial with zeros at x=-3, -2, 3, and 4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9949eb9c7e9b3c5728ff137d826d46d9b08b717a)

For the following exercises, use the graph to identify zeros and multiplicity.

[53](<chapter-3>). 

![Graph of a negative even-degree polynomial with zeros at x=-4, -2, 1, and 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b60d243cb3d4a185ad3ac8cbbcab425d6cde208d)

54. 

![Graph of a positive even-degree polynomial with zeros at x=-4, -2, and 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d96eddc99c20efb04bae355770a04a3dbcfd2ce3)

[55](<chapter-3>). 

![Graph of a positive even-degree polynomial with zeros at x=-2,, and 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8f7ea6c6b054f7e1719e3729e8afc077b22ee65c)

56. 

![Graph of a negative odd-degree polynomial with zeros at x=-3, -2, and 1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6a047809d9e54a614a2d3a285dcacc8b96ae03e6)

For the following exercises, use the given information about the polynomial graph to write the equation.

[57](<chapter-3>). 

Degree 3. Zeros at  x=–2, x=–2, x=1, x=1, and  x=3. x=3. _y_ -intercept at  (0,–4). (0,–4).

58. 

Degree 3. Zeros at  x=–5, x=–5, x=–2, x=–2, and  x=1. x=1. _y_ -intercept at  (0,6) (0,6)

[59](<chapter-3>). 

Degree 5. Roots of multiplicity 2 at  x=3 x=3 and  x=1 x=1 , and a root of multiplicity 1 at  x=–3. x=–3. _y_ -intercept at  (0,9) (0,9)

60. 

Degree 4. Root of multiplicity 2 at  x=4, x=4, and a roots of multiplicity 1 at  x=1 x=1 and  x=–2. x=–2. _y_ -intercept at  (0,–3). (0,–3).

[61](<chapter-3>). 

Degree 5. Double zero at  x=1, x=1, and triple zero at  x=3. x=3. Passes through the point  (2,15). (2,15).

62. 

Degree 3. Zeros at  x=4, x=4, x=3, x=3, and  x=2. x=2. _y_ -intercept at  ( 0,−24 ). ( 0,−24 ).

[63](<chapter-3>). 

Degree 3. Zeros at  x=−3, x=−3, x=−2 x=−2 and  x=1. x=1. _y_ -intercept at  (0,12). (0,12).

64. 

Degree 5. Roots of multiplicity 2 at  x=−3 x=−3 and  x=2 x=2 and a root of multiplicity 1 at  x=−2. x=−2.

_y_ -intercept at  ( 0,4 ). ( 0,4 ).

[65](<chapter-3>). 

Degree 4. Roots of multiplicity 2 at  x= 1 2 x= 1 2 and roots of multiplicity 1 at  x=6 x=6 and  x=−2. x=−2.

_y_ -intercept at  ( 0,18 ). ( 0,18 ).

66. 

Double zero at  x=−3 x=−3 and triple zero at  x=0. x=0. Passes through the point  (1,32). (1,32).

#### Technology

For the following exercises, use a calculator to approximate local minima and maxima or the global minimum and maximum.

[67](<chapter-3>). 

f(x)= x 3 −x−1 f(x)= x 3 −x−1

68. 

f(x)=2 x 3 −3x−1 f(x)=2 x 3 −3x−1

[69](<chapter-3>). 

f(x)= x 4 +x f(x)= x 4 +x

70. 

f(x)=− x 4 +3x−2 f(x)=− x 4 +3x−2

[71](<chapter-3>). 

f(x)= x 4 − x 3 +1 f(x)= x 4 − x 3 +1

#### Extensions

For the following exercises, use the graphs to write a polynomial function of least degree.

72. 

![Graph of a positive odd-degree polynomial with zeros at x = negative 2/3, 1/2, and 4/3 and y = 8.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/111deb036487e32f39e33c574d66149d62151e02)

[73](<chapter-3>). 

![Graph of a positive odd-degree polynomial with zeros at x=--200, and 500 and y=50000000.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/66ee2295211e97e6c0f4c8332a77ea5d0d0b961a)

74. 

![Graph of a positive odd-degree polynomial with zeros at x=--300, and 100 and y=-90000.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7b5678a0d6080c69ed91f23d6cdd403c1c960b4f)

#### Real-World Applications

For the following exercises, write the polynomial function that models the given situation.

[75](<chapter-3>). 

A rectangle has a length of 10 units and a width of 8 units. Squares of  x x by  x x units are cut out of each corner, and then the sides are folded up to create an open box. Express the volume of the box as a polynomial function in terms of  x. x.

76. 

Consider the same rectangle of the preceding problem. Squares of  2x 2x by  2x 2x units are cut out of each corner. Express the volume of the box as a polynomial in terms of  x. x.

[77](<chapter-3>). 

A square has sides of 12 units. Squares  x+1 x+1 by  x+1 x+1 units are cut out of each corner, and then the sides are folded up to create an open box. Express the volume of the box as a function in terms of  x. x.

78. 

A cylinder has a radius of  x+2 x+2 units and a height of 3 units greater. Express the volume of the cylinder as a polynomial function.

[79](<chapter-3>). 

A right circular cone has a radius of  3x+6 3x+6 and a height 3 units less. Express the volume of the cone as a polynomial function. The volume of a cone is  V= 1 3 π r 2 h V= 1 3 π r 2 h for radius  r r and height  h. h.


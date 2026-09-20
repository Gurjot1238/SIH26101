# 3.8 Inverses and Radical Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/3-8-inverses-and-radical-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.8 Inverses and Radical Functions

### Learning Objectives

In this section, you will:

  * Find the inverse of a polynomial function.
  * Restrict the domain to find the inverse of a polynomial function.

A mound of gravel is in the shape of a cone with the height equal to twice the radius.

![Gravel in the shape of a cone.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b91ae06dad3cdb0412db8cff73515f372ea917b5) Figure  1

The volume is found using a formula from elementary geometry.

V= 1 3 π r 2 h = 1 3 π r 2 (2r) = 2 3 π r 3 V= 1 3 π r 2 h = 1 3 π r 2 (2r) = 2 3 π r 3

We have written the volume  V V in terms of the radius  r. r. However, in some cases, we may start out with the volume and want to find the radius. For example: A customer purchases 100 cubic feet of gravel to construct a cone shape mound with a height twice the radius. What are the radius and height of the new cone? To answer this question, we use the formula

r= 3V 2π 3 r= 3V 2π 3

This function is the inverse of the formula for  V V in terms of  r. r.

In this section, we will explore the inverses of polynomial and rational functions and in particular the radical functions we encounter in the process.

### Finding the Inverse of a Polynomial Function

Two functions  f f and  g g are inverse functions if for every coordinate pair in  f,(a,b), f,(a,b), there exists a corresponding coordinate pair in the inverse function,  g,(b,a). g,(b,a). In other words, the coordinate pairs of the inverse functions have the input and output interchanged.

For a function to have an inverse function the function to create a new function that is one-to-one and would have an inverse function.

For example, suppose a water runoff collector is built in the shape of a parabolic trough as shown in [Figure 2](<3-8-inverses-and-radical-functions#Figure_03_08_002>). We can use the information in the figure to find the surface area of the water in the trough as a function of the depth of the water.

![Diagram of a parabolic trough that is 18” in height, 3’ in length, and 12” in width.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1d361de6ef84f0703aaa4fe3b93dff47afbdb8a9) Figure  2

Because it will be helpful to have an equation for the parabolic cross-sectional shape, we will impose a coordinate system at the cross section, with  x x measured horizontally and  y y measured vertically, with the origin at the vertex of the parabola. See [Figure 3](<3-8-inverses-and-radical-functions#Figure_03_08_003>).

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f038a33b80b03a75437ec3ba3c9554985e0d0777) Figure  3

From this we find an equation for the parabolic shape. We placed the origin at the vertex of the parabola, so we know the equation will have form  y(x)=a x 2 . y(x)=a x 2 . Our equation will need to pass through the point (6, 18), from which we can solve for the stretch factor  a. a.

18=a 6 2 a= 18 36 = 1 2 18=a 6 2 a= 18 36 = 1 2

Our parabolic cross section has the equation

y(x)= 1 2 x 2 y(x)= 1 2 x 2

We are interested in the surface area of the water, so we must determine the width at the top of the water as a function of the water depth. For any depth  y y the width will be given by  2x, 2x, so we need to solve the equation above for  x x and find the inverse function. However, notice that the original function is not one-to-one, and indeed, given any output there are two inputs that produce the same output, one positive and one negative.

To find an inverse, we can restrict our original function to a limited domain on which it _is_ one-to-one. In this case, it makes sense to restrict ourselves to positive  x x values. On this domain, we can find an inverse by solving for the input variable:

y= 1 2 x 2 2y= x 2 x=± 2y y= 1 2 x 2 2y= x 2 x=± 2y

This is not a function as written. We are limiting ourselves to positive  x x values, so we eliminate the negative solution, giving us the inverse function we’re looking for.

y= x 2 2 ,x>0 y= x 2 2 ,x>0

Because  x x is the distance from the center of the parabola to either side, the entire width of the water at the top will be  2x. 2x. The trough is 3 feet (36 inches) long, so the surface area will then be:

Area=l⋅w =36⋅2x =72x =72 2y Area=l⋅w =36⋅2x =72x =72 2y

This example illustrates two important points:

  1. When finding the inverse of a quadratic, we have to limit ourselves to a domain on which the function is one-to-one.
  2. The inverse of a quadratic function is a square root function. Both are toolkit functions and different types of power functions.

Functions involving roots are often called radical functions. While it is not possible to find an inverse of most polynomial functions, some basic polynomials do have inverses. Such functions are called invertible functions, and we use the notation  f −1 (x). f −1 (x).

Warning:  f −1 (x) f −1 (x) is not the same as the reciprocal of the function  f( x ). f( x ). This use of “–1” is reserved to denote inverse functions. To denote the reciprocal of a function  f( x ), f( x ), we would need to write  ( f( x ) ) −1 = 1 f( x ) . ( f( x ) ) −1 = 1 f( x ) .

An important relationship between inverse functions is that they “undo” each other. If  f −1 f −1 is the inverse of a function  f, f, then  f f is the inverse of the function  f −1 . f −1 . In other words, whatever the function  f f does to  x, x, f −1 f −1 undoes it—and vice-versa. More formally, we write

f −1 ( f( x ) )=x,for all x in the domain of f f −1 ( f( x ) )=x,for all x in the domain of f

and

f( f −1 ( x ) )=x,for all x in the domain of  f −1 f( f −1 ( x ) )=x,for all x in the domain of  f −1

###  Verifying Two Functions Are Inverses of One Another

Two functions,  f f and  g, g, are inverses of one another if for all  x x in the domain of  f f and  g. g.

g( f( x ) )=f( g( x ) )=x g( f( x ) )=f( g( x ) )=x

###  How To

**Given a polynomial function, find the inverse of the function by restricting the domain in such a way that the new function is one-to-one.**

  1. Replace  f( x ) f( x ) with  y. y.
  2. Interchange  x x and  y. y.
  3. Solve for  y, y, and rename the function  f −1 (x). f −1 (x).

###  Example  1

#### Verifying Inverse Functions

Show that  f( x )= 1 x+1 f( x )= 1 x+1 and  f −1 ( x )= 1 x −1 f −1 ( x )= 1 x −1 are inverses, for  x≠0,−1 x≠0,−1 .

####  Solution

We must show that  f −1 ( f( x ) )=x f −1 ( f( x ) )=x and  f( f −1 ( x ) )=x. f( f −1 ( x ) )=x.

f −1 (f(x))= f −1 ( 1 x+1 ) = 1 1 x+1 −1 =(x+1)−1 =x f( f −1 (x))=f( 1 x −1 ) = 1 ( 1 x −1 )+1 = 1 1 x =x f −1 (f(x))= f −1 ( 1 x+1 ) = 1 1 x+1 −1 =(x+1)−1 =x f( f −1 (x))=f( 1 x −1 ) = 1 ( 1 x −1 )+1 = 1 1 x =x

Therefore,  f( x )= 1 x+1 f( x )= 1 x+1 and  f −1 ( x )= 1 x −1 f −1 ( x )= 1 x −1 are inverses.

###  Try It  #1

Show that  f( x )= x+5 3 f( x )= x+5 3 and  f −1 ( x )=3x−5 f −1 ( x )=3x−5 are inverses.

###  Example  2

#### Finding the Inverse of a Cubic Function

Find the inverse of the function  f(x)=5 x 3 +1. f(x)=5 x 3 +1.

####  Solution

This is a transformation of the basic cubic toolkit function, and based on our knowledge of that function, we know it is one-to-one. Solving for the inverse by solving for  x. x.

y=5 x 3 +1 x=5 y 3 +1 x−1=5 y 3 x−1 5 = y 3 f −1 (x)= x−1 5 3 y=5 x 3 +1 x=5 y 3 +1 x−1=5 y 3 x−1 5 = y 3 f −1 (x)= x−1 5 3

#### Analysis 

Look at the graph of  f f and  f –1 . f –1 . Notice that the two graphs are symmetrical about the line  y=x. y=x. This is always the case when graphing a function and its inverse function. 

Also, since the method involved interchanging  x x and  y, y, notice corresponding points. If  (a,b) (a,b) is on the graph of  f, f, then  (b,a) (b,a) is on the graph of  f –1 . f –1 . Since  (0,1) (0,1) is on the graph of  f, f, then  (1,0) (1,0) is on the graph of  f –1 . f –1 . Similarly, since  (1,6) (1,6) is on the graph of  f, f, then  (6,1) (6,1) is on the graph of  f –1 . f –1 . See [Figure 4](<3-8-inverses-and-radical-functions#Figure_03_08_004>).

![Graph of f\(x\)=5x^3+1 and its inverse, f^\(-1\)\(x\)=3sqrt\(\(x-1\)/\(5\)\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/447dcc8a8d4abc6a6a5229d595cc345140c17ddb) Figure  4

###  Try It  #2

Find the inverse function of  f(x)= x+4 3 . f(x)= x+4 3 .

### Restricting the Domain to Find the Inverse of a Polynomial Function

So far, we have been able to find the inverse functions of cubic functions without having to restrict their domains. However, as we know, not all cubic polynomials are one-to-one. Some functions that are not one-to-one may have their domain restricted so that they are one-to-one, but only over that domain. The function over the restricted domain would then have an inverse function. Since quadratic functions are not one-to-one, we must restrict their domain in order to find their inverses.

###  Restricting the Domain

If a function is not one-to-one, it cannot have an inverse. If we restrict the domain of the function so that it becomes one-to-one, thus creating a new function, this new function will have an inverse.

###  How To

**Given a polynomial function, restrict the domain of a function that is not one-to-one and then find the inverse.**

  1. Restrict the domain by determining a domain on which the original function is one-to-one.
  2. Replace  f(x)withy. f(x)withy.
  3. Interchange  xandy. xandy.
  4. Solve for  y, y, and rename the function or pair of function  f −1 (x). f −1 (x).
  5. Revise the formula for  f −1 (x) f −1 (x) by ensuring that the outputs of the inverse function correspond to the restricted domain of the original function.

###  Example  3

#### Restricting the Domain to Find the Inverse of a Polynomial Function

Find the inverse function of  f: f:

  1. f(x)= (x−4) 2 ,x≥4 f(x)= (x−4) 2 ,x≥4
  2. f(x)= (x−4) 2 ,x≤4 f(x)= (x−4) 2 ,x≤4

####  Solution

The original function  f(x)= (x−4) 2 f(x)= (x−4) 2 is not one-to-one, but the function is restricted to a domain of  x≥4 x≥4 or  x≤4 x≤4 on which it is one-to-one. See [Figure 5](<3-8-inverses-and-radical-functions#Figure_03_08_005>).

![Two graphs of f\(x\)=\(x-4\)^2 where the first is when x>=4 and the second is when x<=4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a7ce5179e5d708c5222bc67d9a971821755ee70f) Figure  5

To find the inverse, start by replacing  f(x) f(x) with the simple variable  y. y.

y= (x−4) 2 Interchangexandy. x= (y−4) 2 Take the square root. ± x =y−4 Add4to both sides. 4± x =y y= (x−4) 2 Interchangexandy. x= (y−4) 2 Take the square root. ± x =y−4 Add4to both sides. 4± x =y

This is not a function as written. We need to examine the restrictions on the domain of the original function to determine the inverse. Since we reversed the roles of  x x and  y y for the original  f(x), f(x), we looked at the domain: the values  x x could assume. When we reversed the roles of  x x and  y, y, this gave us the values  y y could assume. For this function,  x≥4, x≥4, so for the inverse, we should have  y≥4, y≥4, which is what our inverse function gives.

  1. ⓐThe domain of the original function was restricted to  x≥4, x≥4, so the outputs of the inverse need to be the same,  f( x )≥4, f( x )≥4, and we must use the + case: 

f −1 (x)=4+ x f −1 (x)=4+ x

  2. ⓑ The domain of the original function was restricted to  x≤4, x≤4, so the outputs of the inverse need to be the same,  f( x )≤4, f( x )≤4, and we must use the – case: 

f −1 (x)=4− x f −1 (x)=4− x

#### Analysis 

On the graphs in [Figure 6](<3-8-inverses-and-radical-functions#Figure_03_08_006>), we see the original function graphed on the same set of axes as its inverse function. Notice that together the graphs show symmetry about the line  y=x. y=x. The coordinate pair  (4,0) (4,0) is on the graph of  f f and the coordinate pair  (0,4) (0,4) is on the graph of  f −1 . f −1 . For any coordinate pair, if  ( a,b ) ( a,b ) is on the graph of  f, f, then  ( b,a ) ( b,a ) is on the graph of  f −1 . f −1 . Finally, observe that the graph of  f f intersects the graph of  f −1 f −1 on the line  y=x. y=x. Points of intersection for the graphs of  f f and  f −1 f −1 will always lie on the line  y=x. y=x.

![Two graphs of a parabolic function with half of its inverse.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6640177cc226c8b94a974b5405dafb8fdfe19876) Figure  6

###  Example  4

#### Finding the Inverse of a Quadratic Function When the Restriction Is Not Specified

Restrict the domain and then find the inverse of

f(x)= (x−2) 2 −3. f(x)= (x−2) 2 −3.

####  Solution

We can see this is a parabola with vertex at  (2,–3) (2,–3) that opens upward. Because the graph will be decreasing on one side of the vertex and increasing on the other side, we can restrict this function to a domain on which it will be one-to-one by limiting the domain to  x≥2. x≥2.

To find the inverse, we will use the vertex form of the quadratic. We start by replacing  f(x) f(x) with a simple variable,  y, y, then solve for  x. x.

y= (x−2) 2 −3 Interchangexandy. x= (y−2) 2 −3 Add 3 to both sides. x+3= (y−2) 2 Take the square root. ± x+3 =y−2 Add 2 to both sides. 2± x+3 =y Rename the function. f −1 (x)=2± x+3 y= (x−2) 2 −3 Interchangexandy. x= (y−2) 2 −3 Add 3 to both sides. x+3= (y−2) 2 Take the square root. ± x+3 =y−2 Add 2 to both sides. 2± x+3 =y Rename the function. f −1 (x)=2± x+3

Now we need to determine which case to use. Because we restricted our original function to a domain of  x≥2, x≥2, the outputs of the inverse should be the same, telling us to utilize the + case

f −1 (x)=2+ x+3 f −1 (x)=2+ x+3

If the quadratic had not been given in vertex form, rewriting it into vertex form would be the first step. This way we may easily observe the coordinates of the vertex to help us restrict the domain.

#### Analysis 

Notice that we arbitrarily decided to restrict the domain on  x≥2. x≥2. We could just have easily opted to restrict the domain on  x≤2, x≤2, in which case  f −1 (x)=2− x+3 . f −1 (x)=2− x+3 . Observe the original function graphed on the same set of axes as its inverse function in [Figure 7](<3-8-inverses-and-radical-functions#Figure_03_08_007>). Notice that both graphs show symmetry about the line  y=x. y=x. The coordinate pair  ( 2,−3 ) ( 2,−3 ) is on the graph of  f f and the coordinate pair  ( −3,2 ) ( −3,2 ) is on the graph of  f −1 . f −1 . Observe from the graph of both functions on the same set of axes that 

domain of f=range of f –1 =[ 2,∞ ) domain of f=range of f –1 =[ 2,∞ )

and

domain of  f –1 =range off=[ –3,∞ ) domain of  f –1 =range off=[ –3,∞ )

Finally, observe that the graph of  f f intersects the graph of  f −1 f −1 along the line  y=x. y=x.

![Graph of a parabolic function with half of its inverse.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ee562c60f385e383ca70f40f8e220dd891b4dab9) Figure  7

###  Try It  #3

Find the inverse of the function  f(x)= x 2 +1, f(x)= x 2 +1, on the domain  x≥0. x≥0.

#### Solving Applications of Radical Functions

Notice that the functions from previous examples were all polynomials, and their inverses were radical functions. If we want to find the inverse of a radical function, we will need to restrict the domain of the answer because the range of the original function is limited.

###  How To

**Given a radical function, find the inverse.**

  1. Determine the range of the original function.
  2. Replace  f( x ) f( x ) with  y, y, then solve for  x. x.
  3. If necessary, restrict the domain of the inverse function to the range of the original function.

###  Example  5

#### Finding the Inverse of a Radical Function

Restrict the domain and then find the inverse of the function  f(x)= x−4 . f(x)= x−4 .

####  Solution

Note that the original function has range  f(x)≥0. f(x)≥0. Replace  f(x) f(x) with  y, y, then solve for  x. x.

y = x−4 Replace f(x) with y. x = y−4 Interchange x and y. x = y−4 Square each side. x 2 =y−4 Add 4. x 2 +4 =y Rename the function  f −1 (x). f −1 (x) = x 2 +4 y = x−4 Replace f(x) with y. x = y−4 Interchange x and y. x = y−4 Square each side. x 2 =y−4 Add 4. x 2 +4 =y Rename the function  f −1 (x). f −1 (x) = x 2 +4

Recall that the domain of this function must be limited to the range of the original function.

f −1 (x)= x 2 +4,x≥0 f −1 (x)= x 2 +4,x≥0

#### Analysis

Notice in [Figure 8](<3-8-inverses-and-radical-functions#Figure_03_08_008>) that the inverse is a reflection of the original function over the line  y=x. y=x. Because the original function has only positive outputs, the inverse function has only positive inputs.

![Graph of f\(x\)=sqrt\(x-4\) and its inverse, f^\(-1\)\(x\)=x^2+4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/96839ec291350f5957f9c68f33ae38153e7ccb9d) Figure  8

###  Try It  #4

Restrict the domain and then find the inverse of the function  f(x)= 2x+3 . f(x)= 2x+3 .

#### 

Radical functions are common in physical models, as we saw in the section opener. We now have enough tools to be able to solve the problem posed at the start of the section.

###  Example  6

#### Solving an Application with a Cubic Function

A mound of gravel is in the shape of a cone with the height equal to twice the radius. The volume of the cone in terms of the radius is given by

V= 2 3 π r 3 V= 2 3 π r 3

Find the inverse of the function  V= 2 3 π r 3 V= 2 3 π r 3 that determines the volume  V V of a cone and is a function of the radius  r. r. Then use the inverse function to calculate the radius of such a mound of gravel measuring 100 cubic feet. Use  π=3.14. π=3.14.

####  Solution

Start with the given function for  V. V. Notice that the meaningful domain for the function is  r≥0 r≥0 since negative radii would not make sense in this context. Also note the range of the function (hence, the domain of the inverse function) is  V≥0. V≥0. Solve for  r r in terms of  V, V, using the method outlined previously.  

V= 2 3 π r 3 r 3 = 3V 2π Solve for  r 3 . r= 3V 2π 3 Solve for r. V= 2 3 π r 3 r 3 = 3V 2π Solve for  r 3 . r= 3V 2π 3 Solve for r.

This is the result stated in the section opener. Now evaluate this for  V=100 V=100 and  π=3.14. π=3.14.

r= 3V 2π 3 = 3⋅100 2⋅3.14 3 ≈ 47.7707 3 ≈3.63 r= 3V 2π 3 = 3⋅100 2⋅3.14 3 ≈ 47.7707 3 ≈3.63

Therefore, the radius is about 3.63 ft.

#### Determining the Domain of a Radical Function Composed with Other Functions

When radical functions are composed with other functions, determining domain can become more complicated.

###  Example  7

#### Finding the Domain of a Radical Function Composed with a Rational Function

Find the domain of the function  f(x)= (x+2)(x−3) (x−1) . f(x)= (x+2)(x−3) (x−1) .

####  Solution

Because a square root is only defined when the quantity under the radical is non-negative, we need to determine where  (x+2)(x−3) (x−1) ≥0. (x+2)(x−3) (x−1) ≥0. The output of a rational function can change signs (change from positive to negative or vice versa) at _x_ -intercepts and at vertical asymptotes. For this equation, the graph could change signs at xx = –2, 1, and 3. 

To determine the intervals on which the rational expression is positive, we could test some values in the expression or sketch a graph. While both approaches work equally well, for this example we will use a graph as shown in [Figure 9](<3-8-inverses-and-radical-functions#Figure_03_08_009>).

![Graph of a radical function that shows where the outputs are nonnegative.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/36e840997485cb2bf1a0fe1ff88f1cdc297213db) Figure  9

This function has two _x_ -intercepts, both of which exhibit linear behavior near the _x_ -intercepts. There is one vertical asymptote, corresponding to a linear factor; this behavior is similar to the basic reciprocal toolkit function, and there is no horizontal asymptote because the degree of the numerator is larger than the degree of the denominator. There is a _y_ -intercept at  (0, 6 ). (0, 6 ).

From the _y_ -intercept and _x_ -intercept at  x=−2, x=−2, we can sketch the left side of the graph. From the behavior at the asymptote, we can sketch the right side of the graph.

From the graph, we can now tell on which intervals the outputs will be non-negative, so that we can be sure that the original function  f( x ) f( x ) will be defined.  f( x ) f( x ) has domain  −2≤x<1orx≥3, −2≤x<1orx≥3, or in interval notation,  [−2,1)∪[3,∞). [−2,1)∪[3,∞).

#### Finding Inverses of Rational Functions

As with finding inverses of quadratic functions, it is sometimes desirable to find the inverse of a rational function, particularly of rational functions that are the ratio of linear functions, such as in concentration applications.

###  Example  8

#### Finding the Inverse of a Rational Function

The function  C= 20+0.4n 100+n C= 20+0.4n 100+n represents the concentration  C C of an acid solution after  n n mL of 40% solution has been added to 100 mL of a 20% solution. First, find the inverse of the function; that is, find an expression for  n n in terms of  C. C. Then use your result to determine how much of the 40% solution should be added so that the final mixture is a 35% solution.

####  Solution

We first want the inverse of the function. We will solve for  n n in terms of  C. C.

C= 20+0.4n 100+n C(100+n)=20+0.4n 100C+Cn=20+0.4n 100C−20=0.4n−Cn 100C−20=(0.4−C)n n= 100C−20 0.4−C C= 20+0.4n 100+n C(100+n)=20+0.4n 100C+Cn=20+0.4n 100C−20=0.4n−Cn 100C−20=(0.4−C)n n= 100C−20 0.4−C

Now evaluate this function for  C=0.35(35%). C=0.35(35%).

n= 100(0.35)−20 0.4−0.35 = 15 0.05 =300 n= 100(0.35)−20 0.4−0.35 = 15 0.05 =300

We can conclude that 300 mL of the 40% solution should be added.

###  Try It  #5

Find the inverse of the function  f(x)= x+3 x−2 . f(x)= x+3 x−2 .

###  Media

Access these online resources for additional instruction and practice with inverses and radical functions.

  * [Graphing the Basic Square Root Function](<http://openstax.org/l/graphsquareroot>)
  * [Find the Inverse of a Square Root Function](<http://openstax.org/l/inversesquare>)
  * [Find the Inverse of a Rational Function](<http://openstax.org/l/inverserational>)
  * [Find the Inverse of a Rational Function and an Inverse Function Value](<http://openstax.org/l/rationalinverse>)
  * [Inverse Functions](<http://openstax.org/l/inversefunction>)

###  3.8 Section Exercises

#### Verbal

[1](<chapter-3>). 

Explain why we cannot find inverse functions for all polynomial functions.

2. 

Why must we restrict the domain of a quadratic function when finding its inverse?

[3](<chapter-3>). 

When finding the inverse of a radical function, what restriction will we need to make?

4. 

The inverse of a quadratic function will always take what form?

#### Algebraic

For the following exercises, find the inverse of the function on the given domain.

[5](<chapter-3>). 

f( x )= ( x−4 ) 2 ,[4,∞) f( x )= ( x−4 ) 2 ,[4,∞)

6. 

f( x )= ( x+2 ) 2 ,[−2,∞) f( x )= ( x+2 ) 2 ,[−2,∞)

[7](<chapter-3>). 

f(x)= ( x+1 ) 2 −3,[−1,∞) f(x)= ( x+1 ) 2 −3,[−1,∞)

8. 

f(x)=2− 3+x f(x)=2− 3+x

[9](<chapter-3>). 

f(x)=3 x 2 +5,( − ∞,0 ] f(x)=3 x 2 +5,( − ∞,0 ]

10. 

f( x )=12− x 2 ,[0,∞) f( x )=12− x 2 ,[0,∞)

[11](<chapter-3>). 

f( x )=9− x 2 ,[0,∞) f( x )=9− x 2 ,[0,∞)

12. 

f(x)=2 x 2 +4,[0,∞) f(x)=2 x 2 +4,[0,∞)

For the following exercises, find the inverse of the functions.

[13](<chapter-3>). 

f(x)= x 3 +5 f(x)= x 3 +5

14. 

f( x )=3 x 3 +1 f( x )=3 x 3 +1

[15](<chapter-3>). 

f(x)=4− x 3 f(x)=4− x 3

16. 

f( x )=4−2 x 3 f( x )=4−2 x 3

For the following exercises, find the inverse of the functions.

[17](<chapter-3>). 

f(x)= 2x+1 f(x)= 2x+1

18. 

f(x)= 3−4x f(x)= 3−4x

[19](<chapter-3>). 

f( x )=9+ 4x−4 f( x )=9+ 4x−4

20. 

f( x )= 6x−8 +5 f( x )= 6x−8 +5

[21](<chapter-3>). 

f( x )=9+2 x 3 f( x )=9+2 x 3

22. 

f( x )=3− x 3 f( x )=3− x 3

[23](<chapter-3>). 

f( x )= 2 x+8 f( x )= 2 x+8

24. 

f( x )= 3 x−4 f( x )= 3 x−4

[25](<chapter-3>). 

f( x )= x+3 x+7 f( x )= x+3 x+7

26. 

f( x )= x−2 x+7 f( x )= x−2 x+7

[27](<chapter-3>). 

f( x )= 3x+4 5−4x f( x )= 3x+4 5−4x

28. 

f( x )= 5x+1 2−5x f( x )= 5x+1 2−5x

[29](<chapter-3>). 

f(x)= x 2 +2x,[−1,∞) f(x)= x 2 +2x,[−1,∞)

30. 

f(x)= x 2 +4x+1,[−2,∞) f(x)= x 2 +4x+1,[−2,∞)

[31](<chapter-3>). 

f(x)= x 2 −6x+3,[3,∞) f(x)= x 2 −6x+3,[3,∞)

#### Graphical

For the following exercises, find the inverse of the function and graph both the function and its inverse.

32. 

f(x)= x 2 +2,x≥0 f(x)= x 2 +2,x≥0

[33](<chapter-3>). 

f(x)=4− x 2 ,x≥0 f(x)=4− x 2 ,x≥0

34. 

f(x)= ( x+3 ) 2 ,x≥−3 f(x)= ( x+3 ) 2 ,x≥−3

[35](<chapter-3>). 

f(x)= ( x−4 ) 2 ,x≥4 f(x)= ( x−4 ) 2 ,x≥4

36. 

f(x)= x 3 +3 f(x)= x 3 +3

[37](<chapter-3>). 

f(x)=1− x 3 f(x)=1− x 3

38. 

f(x)= x 2 +4x,x≥−2 f(x)= x 2 +4x,x≥−2

[39](<chapter-3>). 

f(x)= x 2 −6x+1,x≥3 f(x)= x 2 −6x+1,x≥3

40. 

f(x)= 2 x f(x)= 2 x

[41](<chapter-3>). 

f(x)= 1 x 2 ,x≥0 f(x)= 1 x 2 ,x≥0

For the following exercises, use a graph to help determine the domain of the functions.

42. 

f(x)= (x+1)(x−1) x f(x)= (x+1)(x−1) x

[43](<chapter-3>). 

f(x)= (x+2)(x−3) x−1 f(x)= (x+2)(x−3) x−1

44. 

f(x)= x(x+3) x−4 f(x)= x(x+3) x−4

[45](<chapter-3>). 

f(x)= x 2 −x−20 x−2 f(x)= x 2 −x−20 x−2

46. 

f(x)= 9− x 2 x+4 f(x)= 9− x 2 x+4

#### Technology

For the following exercises, use a calculator to graph the function. Then, using the graph, give three points on the graph of the inverse with _y_ -coordinates given.

[47](<chapter-3>). 

f(x)= x 3 −x−2,y=1,2,3 f(x)= x 3 −x−2,y=1,2,3

48. 

f(x)= x 3 +x−2,y=0,1,2 f(x)= x 3 +x−2,y=0,1,2

[49](<chapter-3>). 

f(x)= x 3 +3x−4,y=0,1,2 f(x)= x 3 +3x−4,y=0,1,2

50. 

f(x)= x 3 +8x−4,y=−1,0,1 f(x)= x 3 +8x−4,y=−1,0,1

[51](<chapter-3>). 

f(x)= x 4 +5x+1,y=−1,0,1 f(x)= x 4 +5x+1,y=−1,0,1

####  Extensions

For the following exercises, find the inverse of the functions with  a,b,c a,b,c positive real numbers.

52. 

f(x)=a x 3 +b f(x)=a x 3 +b

[53](<chapter-3>). 

f(x)= x 2 +bx f(x)= x 2 +bx

54. 

f(x)= a x 2 +b f(x)= a x 2 +b

[55](<chapter-3>). 

f(x)= ax+b 3 f(x)= ax+b 3

56. 

f(x)= ax+b x+c f(x)= ax+b x+c

#### Real-World Applications

For the following exercises, determine the function described and then use it to answer the question.

[57](<chapter-3>). 

An object dropped from a height of 200 meters has a height,  h( t ), h( t ), in meters after  t t seconds have lapsed, such that  h(t)=200−4.9 t 2 . h(t)=200−4.9 t 2 . Express  t t as a function of height,  h, h, and find the time to reach a height of 50 meters.

58. 

An object dropped from a height of 600 feet has a height,  h( t ), h( t ), in feet after  t t seconds have elapsed, such that  h(t)=600−16 t 2 . h(t)=600−16 t 2 . Express  t t as a function of height  h, h, and find the time to reach a height of 400 feet.

[59](<chapter-3>). 

The volume,  V, V, of a sphere in terms of its radius,  r, r, is given by  V(r)= 4 3 π r 3 . V(r)= 4 3 π r 3 . Express  r r as a function of  V, V, and find the radius of a sphere with volume of 200 cubic feet.

60. 

The surface area,  A, A, of a sphere in terms of its radius,  r, r, is given by  A(r)=4π r 2 . A(r)=4π r 2 . Express  r r as a function of  A, A, and find the radius of a sphere with a surface area of 1000 square inches.

[61](<chapter-3>). 

A container holds 100 ml of a solution that is 25 ml acid. If  n n ml of a solution that is 60% acid is added, the function  C(n)= 25+.6n 100+n C(n)= 25+.6n 100+n gives the concentration,  C, C, as a function of the number of ml added,  n. n. Express  n n as a function of  C C and determine the number of mL that need to be added to have a solution that is 50% acid.

62. 

The period  T, T, in seconds, of a simple pendulum as a function of its length  l, l, in feet, is given by  T(l)=2π l 32.2 T(l)=2π l 32.2 . Express  l l as a function of  T T and determine the length of a pendulum with period of 2 seconds.

[63](<chapter-3>). 

The volume of a cylinder ,  V, V, in terms of radius,  r, r, and height,  h, h, is given by  V=π r 2 h. V=π r 2 h. If a cylinder has a height of 6 meters, express the radius as a function of  V V and find the radius of a cylinder with volume of 300 cubic meters.

64. 

The surface area,  A, A, of a cylinder in terms of its radius,  r, r, and height,  h, h, is given by  A=2π r 2 +2πrh. A=2π r 2 +2πrh. If the height of the cylinder is 4 feet, express the radius as a function of  A A and find the radius if the surface area is 200 square feet.

[65](<chapter-3>). 

The volume of a right circular cone,  V, V, in terms of its radius,  r, r, and its height,  h, h, is given by  V= 1 3 π r 2 h. V= 1 3 π r 2 h. Express  r r in terms of  V V if the height of the cone is 12 inches and find the radius of a cone with volume of 50 cubic inches.

66. 

Consider a cone with height of 30 feet. Express the radius,  r, r, in terms of the volume,  V, V, and find the radius of a cone with volume of 1000 cubic feet.


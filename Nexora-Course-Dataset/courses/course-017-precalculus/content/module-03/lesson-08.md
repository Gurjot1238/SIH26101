# 3.7 Rational Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/3-7-rational-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.7 Rational Functions

### Learning Objectives

In this section, you will:

  * Use arrow notation.
  * Solve applied problems involving rational functions.
  * Find the domains of rational functions.
  * Identify vertical asymptotes.
  * Identify horizontal asymptotes.
  * Graph rational functions.

Suppose we know that the cost of making a product is dependent on the number of items,  x, x, produced. This is given by the equation  C(x)=15,000x−0.1 x 2 +1000. C(x)=15,000x−0.1 x 2 +1000. If we want to know the average cost for producing  x x items, we would divide the cost function by the number of items,  x. x.

The average cost function, which yields the average cost per item for  x x items produced, is

f(x)= 15,000x−0.1 x 2 +1000 x f(x)= 15,000x−0.1 x 2 +1000 x

Many other application problems require finding an average value in a similar way, giving us variables in the denominator. Written without a variable in the denominator, this function will contain a negative integer power.

In the last few sections, we have worked with polynomial functions, which are functions with non-negative integers for exponents. In this section, we explore rational functions, which have variables in the denominator.

### Using Arrow Notation 

We have seen the graphs of the basic reciprocal function and the squared reciprocal function from our study of toolkit functions. Examine these graphs, as shown in [Figure 1](<3-7-rational-functions#Figure_03_07_001>), and notice some of their features.

![Graphs of f\(x\)=1/x and f\(x\)=1/x^2](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9b4fa73c76c65d7d37dc0f33515af03e0e70fe21) Figure  1

Several things are apparent if we examine the graph of  f(x)= 1 x . f(x)= 1 x .

  1. On the left branch of the graph, the curve approaches the _x_ -axis  (y=0)asx→–∞. (y=0)asx→–∞.
  2. As the graph approaches  x=0 x=0 from the left, the curve drops, but as we approach zero from the right, the curve rises.
  3. Finally, on the right branch of the graph, the curves approaches the _x-_ axis  (y=0)asx→∞. (y=0)asx→∞.

To summarize, we use arrow notation to show that  x x or  f(x) f(x) is approaching a particular value. See [Table 1](<3-7-rational-functions#Table_03_07_001>).

Symbol | Meaning  
---|---  
x→ a − x→ a − |  x x approaches  a a from the left (  x<a x<a but close to  a a )  
x→ a + x→ a + |  x x approaches  a a from the right (  x>a x>a but close to  a a )  
x→∞ x→∞ |  x x approaches infinity (  x x increases without bound)  
x→−∞ x→−∞ |  x x approaches negative infinity (  x x decreases without bound)  
f(x)→∞ f(x)→∞ | the output approaches infinity (the output increases without bound)  
f(x)→−∞ f(x)→−∞ | the output approaches negative infinity (the output decreases without bound)  
f(x)→a f(x)→a | the output approaches  a a  
  
Table  1 Arrow Notation

#### Local Behavior of  f(x)= 1 x f(x)= 1 x

Let’s begin by looking at the reciprocal function,  f(x)= 1 x . f(x)= 1 x . We cannot divide by zero, which means the function is undefined at  x=0; x=0; so zero is not in the domain _._ As the input values approach zero from the left side (becoming very small, negative values), the function values decrease without bound (in other words, they approach negative infinity). We can see this behavior in [Table 2](<3-7-rational-functions#Table_03_07_002>).

** x x ** | –0.1 | –0.01 | –0.001 | –0.0001  
---|---|---|---|---  
** f(x)= 1 x f(x)= 1 x ** | –10 | –100 | –1000 | –10,000  
  
Table  2

We write in arrow notation

as x→ 0 − ,f(x)→−∞ as x→ 0 − ,f(x)→−∞

As the input values approach zero from the right side (becoming very small, positive values), the function values increase without bound (approaching infinity). We can see this behavior in [Table 3](<3-7-rational-functions#Table_03_07_003>).

** x x ** | 0.1 | 0.01 | 0.001 | 0.0001  
---|---|---|---|---  
** f(x)= 1 x f(x)= 1 x ** | 10 | 100 | 1000 | 10,000  
  
Table  3

We write in arrow notation

As x→ 0 + ,f(x)→∞. As x→ 0 + ,f(x)→∞.

See [Figure 2](<3-7-rational-functions#Figure_03_07_002>).

![Graph of f\(x\)=1/x which denotes the end behavior. As x goes to negative infinity, f\(x\) goes to 0, and as x goes to 0^-, f\(x\) goes to negative infinity. As x goes to positive infinity, f\(x\) goes to 0, and as x goes to 0^+, f\(x\) goes to positive infinity.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4bbdc4b18106d69904d1b5e46ef5379e612beb45) Figure  2

This behavior creates a **vertical asymptote** , which is a vertical line that the graph approaches but never crosses. In this case, the graph is approaching the vertical line  x=0 x=0 as the input becomes close to zero. See [Figure 3](<3-7-rational-functions#Figure_03_07_003>).

![Graph of f\(x\)=1/x with its vertical asymptote at x=0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/af76af44f269c49bbd584a837f6096fc90091dee) Figure  3

###  Vertical Asymptote

A vertical asymptote of a graph is a vertical line  x=a x=a where the graph tends toward positive or negative infinity as the inputs approach  a. a. We write

As x→a,f(x)→∞,or as x→a,f(x)→−∞. As x→a,f(x)→∞,or as x→a,f(x)→−∞.

#### End Behavior of  f(x)= 1 x f(x)= 1 x

As the values of  x x approach infinity, the function values approach 0. As the values of  x x approach negative infinity, the function values approach 0. See [Figure 4](<3-7-rational-functions#Figure_03_07_004>). Symbolically, using arrow notation

As x→∞,f(x)→0,and as x→−∞,f(x)→0. As x→∞,f(x)→0,and as x→−∞,f(x)→0.

![Graph of f\(x\)=1/x which highlights the segments of the turning points to denote their end behavior.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/672fb7a5dc7802f7b6a358af724858d0dcc3072a) Figure  4

Based on this overall behavior and the graph, we can see that the function approaches 0 but never actually reaches 0; it seems to level off as the inputs become large. This behavior creates a **horizontal asymptote** , a horizontal line that the graph approaches as the input increases or decreases without bound. In this case, the graph is approaching the horizontal line  y=0. y=0. See [Figure 5](<3-7-rational-functions#Figure_03_07_005>)**.**

![Graph of f\(x\)=1/x with its vertical asymptote at x=0 and its horizontal asymptote at y=0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d2c3d388ee52fe15ae5b147d7498f6ba812215cb) Figure  5

###  Horizontal Asymptote

A horizontal asymptote of a graph is a horizontal line  y=b y=b where the graph approaches the line as the inputs increase or decrease without bound. We write

As x→∞ or x→−∞,f(x)→b. As x→∞ or x→−∞,f(x)→b.

###  Example  1

#### Using Arrow Notation

Use arrow notation to describe the end behavior and local behavior of the function graphed in [Figure 6](<3-7-rational-functions#Figure_03_07_006>).

![Graph of f\(x\)=1/\(x-2\)+4 with its vertical asymptote at x=2 and its horizontal asymptote at y=4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ea98905ff4e4c6ccb79a06989c2a4f069f4a8c96) Figure  6

####  Solution

Notice that the graph is showing a vertical asymptote at  x=2, x=2, which tells us that the function is undefined at  x=2. x=2.

As x→ 2 − ,f(x)→−∞, and as x→ 2 + ,f(x)→∞. As x→ 2 − ,f(x)→−∞, and as x→ 2 + ,f(x)→∞.

And as the inputs decrease without bound, the graph appears to be leveling off at output values of 4, indicating a horizontal asymptote at  y=4. y=4. As the inputs increase without bound, the graph levels off at 4.

As x→∞,f(x)→4 and as x→−∞,f(x)→4. As x→∞,f(x)→4 and as x→−∞,f(x)→4.

###  Try It  #1

Use arrow notation to describe the end behavior and local behavior for the reciprocal squared function.

###  Example  2

#### Using Transformations to Graph a Rational Function

Sketch a graph of the reciprocal function shifted two units to the left and up three units. Identify the horizontal and vertical asymptotes of the graph, if any.

####  Solution

Shifting the graph left 2 and up 3 would result in the function

f(x)= 1 x+2 +3 f(x)= 1 x+2 +3

or equivalently, by giving the terms a common denominator,

f(x)= 3x+7 x+2 f(x)= 3x+7 x+2

The graph of the shifted function is displayed in [Figure 7](<3-7-rational-functions#Figure_03_07_007>).

![Graph of f\(x\)=1/\(x+2\)+3 with its vertical asymptote at x=-2 and its horizontal asymptote at y=3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/741b974997c1ac8e7d90c9bd36ea0335af6d10bc) Figure  7

Notice that this function is undefined at  x=−2, x=−2, and the graph also is showing a vertical asymptote at  x=−2. x=−2.

As x→− 2 − ,f(x)→−∞,and asx→− 2 + ,f(x)→∞. As x→− 2 − ,f(x)→−∞,and asx→− 2 + ,f(x)→∞.

As the inputs increase and decrease without bound, the graph appears to be leveling off at output values of 3, indicating a horizontal asymptote at  y=3. y=3.

As x→±∞,f(x)→3. As x→±∞,f(x)→3.

#### Analysis

Notice that horizontal and vertical asymptotes are shifted left 2 and up 3 along with the function.

###  Try It  #2

Sketch the graph, and find the horizontal and vertical asymptotes of the reciprocal squared function that has been shifted right 3 units and down 4 units. 

### Solving Applied Problems Involving Rational Functions

In [Example 2](<3-7-rational-functions#Example_03_07_02>), we shifted a toolkit function in a way that resulted in the function  f(x)= 3x+7 x+2 . f(x)= 3x+7 x+2 . This is an example of a rational function. A **rational function** is a function that can be written as the quotient of two polynomial functions. Many real-world problems require us to find the ratio of two polynomial functions. Problems involving rates and concentrations often involve rational functions.

###  Rational Function

A rational function is a function that can be written as the quotient of two polynomial functions  P(x)andQ(x). P(x)andQ(x).

f(x)= P(x) Q(x) = a p x p + a p−1 x p−1 +...+ a 1 x+ a 0 b q x q + b q−1 x q−1 +...+ b 1 x+ b 0 ,Q(x)≠0 f(x)= P(x) Q(x) = a p x p + a p−1 x p−1 +...+ a 1 x+ a 0 b q x q + b q−1 x q−1 +...+ b 1 x+ b 0 ,Q(x)≠0

###  Example  3

#### Solving an Applied Problem Involving a Rational Function

A large mixing tank currently contains 100 gallons of water into which 5 pounds of sugar have been mixed. A tap will open pouring 10 gallons per minute of water into the tank at the same time sugar is poured into the tank at a rate of 1 pound per minute. Find the concentration (pounds per gallon) of sugar in the tank after 12 minutes. Is that a greater concentration than at the beginning?

####  Solution

Let  t t be the number of minutes since the tap opened. Since the water increases at 10 gallons per minute, and the sugar increases at 1 pound per minute, these are constant rates of change. This tells us the amount of water in the tank is changing linearly, as is the amount of sugar in the tank. We can write an equation independently for each:

water: W(t)=100+10t in gallons sugar: S(t)=5+1t in pounds water: W(t)=100+10t in gallons sugar: S(t)=5+1t in pounds

The concentration,  C, C, will be the ratio of pounds of sugar to gallons of water

C(t)= 5+t 100+10t C(t)= 5+t 100+10t

The concentration after 12 minutes is given by evaluating  C( t ) C( t ) at  t=12. t=12.

C(12)= 5+12 100+10(12) = 17 220 C(12)= 5+12 100+10(12) = 17 220

This means the concentration is 17 pounds of sugar to 220 gallons of water.

At the beginning, the concentration is

C(0)= 5+0 100+10(0) = 1 20 C(0)= 5+0 100+10(0) = 1 20

Since  17 220 ≈0.08> 1 20 =0.05, 17 220 ≈0.08> 1 20 =0.05, the concentration is greater after 12 minutes than at the beginning.

#### Analysis 

To find the horizontal asymptote, divide the leading coefficient in the numerator by the leading coefficient in the denominator:

1 10 =0.1 1 10 =0.1

Notice the horizontal asymptote is  y=0.1. y=0.1. This means the concentration,  C, C, the ratio of pounds of sugar to gallons of water, will approach 0.1 in the long term.

###  Try It  #3

There are 1,200 freshmen and 1,500 sophomores at a prep rally at noon. After 12 p.m., 20 freshmen arrive at the rally every five minutes while 15 sophomores leave the rally. Find the ratio of freshmen to sophomores at 1 p.m.

### Finding the Domains of Rational Functions

A vertical asymptote represents a value at which a rational function is undefined, so that value is not in the domain of the function. A reciprocal function cannot have values in its domain that cause the denominator to equal zero. In general, to find the domain of a rational function, we need to determine which inputs would cause division by zero.

###  Domain of a Rational Function

The domain of a rational function includes all real numbers except those that cause the denominator to equal zero.

###  How To

**Given a rational function, find the domain.**

  1. Set the denominator equal to zero.
  2. Solve to find the _x_ -values that cause the denominator to equal zero.
  3. The domain is all real numbers except those found in Step 2.

###  Example  4

#### Finding the Domain of a Rational Function

Find the domain of  f(x)= x+3 x 2 −9 . f(x)= x+3 x 2 −9 .

####  Solution

Begin by setting the denominator equal to zero and solving.

x 2 −9=0 x 2 =9 x=±3 x 2 −9=0 x 2 =9 x=±3

The denominator is equal to zero when  x=±3. x=±3. The domain of the function is all real numbers except  x=±3. x=±3.

#### Analysis

A graph of this function, as shown in [Figure 8](<3-7-rational-functions#Figure_03_07_009>), confirms that the function is not defined when  x=±3. x=±3.

![Graph of f\(x\)=1/\(x-3\) with its vertical asymptote at x=3 and its horizontal asymptote at y=0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d985bf1c8252f974b2006ece3894b4396e1e8bdd) Figure  8

There is a vertical asymptote at  x=3 x=3 and a hole in the graph at  x=−3. x=−3. We will discuss these types of holes in greater detail later in this section.

###  Try It  #4

Find the domain of  f(x)= 4x 5(x−1)(x−5) . f(x)= 4x 5(x−1)(x−5) .

### Identifying Vertical Asymptotes of Rational Functions

By looking at the graph of a rational function, we can investigate its local behavior and easily see whether there are asymptotes. We may even be able to approximate their location. Even without the graph, however, we can still determine whether a given rational function has any asymptotes, and calculate their location.

#### Vertical Asymptotes

The vertical asymptotes of a rational function may be found by examining the factors of the denominator that are not common to the factors in the numerator. Vertical asymptotes occur at the zeros of such factors.

###  How To

**Given a rational function, identify any vertical asymptotes of its graph.**

  1. Factor the numerator and denominator.
  2. Note any restrictions in the domain of the function.
  3. Reduce the expression by canceling common factors in the numerator and the denominator.
  4. Note any values that cause the denominator to be zero in this simplified version. These are where the vertical asymptotes occur.
  5. Note any restrictions in the domain where asymptotes do not occur. These are removable discontinuities.

###  Example  5

#### Identifying Vertical Asymptotes

Find the vertical asymptotes of the graph of  k(x)= 5+2 x 2 2−x− x 2 . k(x)= 5+2 x 2 2−x− x 2 .

####  Solution

First, factor the numerator and denominator.

k(x)= 5+2 x 2 2−x− x 2 = 5+2 x 2 (2+x)(1−x) k(x)= 5+2 x 2 2−x− x 2 = 5+2 x 2 (2+x)(1−x)

To find the vertical asymptotes, we determine where this function will be undefined by setting the denominator equal to zero:

(2+x)(1−x)=0 x=−2,1 (2+x)(1−x)=0 x=−2,1

Neither  x=–2 x=–2 nor  x=1 x=1 are zeros of the numerator, so the two values indicate two vertical asymptotes. The graph in [Figure 9](<3-7-rational-functions#Figure_03_07_010>) confirms the location of the two vertical asymptotes.

![Graph of k\(x\)=\(5+2x\)^2/\(2-x-x^2\) with its vertical asymptotes at x=-2 and x=1 and its horizontal asymptote at y=-2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2a3399df60f944d119b6eaeda2ee2b7027828ee8) Figure  9

#### Removable Discontinuities

Occasionally, a graph will contain a hole: a single point where the graph is not defined, indicated by an open circle. We call such a hole a removable discontinuity.

For example, the function  f(x)= x 2 −1 x 2 −2x−3 f(x)= x 2 −1 x 2 −2x−3 may be re-written by factoring the numerator and the denominator.

f(x)= ( x+1 )( x−1 ) ( x+1 )( x−3 ) f(x)= ( x+1 )( x−1 ) ( x+1 )( x−3 )

Notice that  x+1 x+1 is a common factor to the numerator and the denominator. The zero of this factor,  x=−1, x=−1, is the location of the removable discontinuity. Notice also that  x–3 x–3 is not a factor in both the numerator and denominator. The zero of this factor,  x=3, x=3, is the vertical asymptote. See [Figure 10](<3-7-rational-functions#Figure_03_07_011>).

![Graph of f\(x\)=\(x^2-1\)/\(x^2-2x-3\) with its vertical asymptote at x=3 and a removable discontinuity at x=-1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2697447a2bc2e561b00a026a22bc67ea9553a17f) Figure  10

###  Removable Discontinuities of Rational Functions

A removable discontinuity occurs in the graph of a rational function at  x=a x=a if  a a is a zero for a factor in the denominator that is common with a factor in the numerator. We factor the numerator and denominator and check for common factors. If we find any, we set the common factor equal to 0 and solve. This is the location of the removable discontinuity. This is true if the multiplicity of this factor is greater than or equal to that in the denominator. If the multiplicity of this factor is greater in the denominator, then there is still an asymptote at that value.

###  Example  6

#### Identifying Vertical Asymptotes and Removable Discontinuities for a Graph 

Find the vertical asymptotes and removable discontinuities of the graph of  k(x)= x−2 x 2 −4 . k(x)= x−2 x 2 −4 .

####  Solution

Factor the numerator and the denominator. 

k(x)= x−2 (x−2)(x+2) k(x)= x−2 (x−2)(x+2)

Notice that there is a common factor in the numerator and the denominator,  x–2. x–2. The zero for this factor is  x=2. x=2. This is the location of the removable discontinuity.

Notice that there is a factor in the denominator that is not in the numerator,  x+2. x+2. The zero for this factor is  x=−2. x=−2. The vertical asymptote is  x=−2. x=−2. See [Figure 11](<3-7-rational-functions#Figure_03_07_012>).

![Graph of k\(x\)=\(x-2\)/\(x-2\)\(x+2\) with its vertical asymptote at x=-2 and a removable discontinuity at x=2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/011c90199c6cc6775738f8cd1e6112f5aaa57567) Figure  11

The graph of this function will have the vertical asymptote at  x=−2, x=−2, but at  x=2 x=2 the graph will have a hole.

###  Try It  #5

Find the vertical asymptotes and removable discontinuities of the graph of  f(x)= x 2 −25 x 3 −6 x 2 +5x . f(x)= x 2 −25 x 3 −6 x 2 +5x .

### Identifying Horizontal Asymptotes of Rational Functions

While vertical asymptotes describe the behavior of a graph as the _output_ gets very large or very small, horizontal asymptotes help describe the behavior of a graph as the _input_ gets very large or very small. Recall that a polynomial’s end behavior will mirror that of the leading term. Likewise, a rational function’s end behavior will mirror that of the ratio of the leading terms of the numerator and denominator functions.

There are three distinct outcomes when checking for horizontal asymptotes:

**Case 1:** If the degree of the denominator > degree of the numerator, there is a horizontal asymptote at  y=0. y=0.

Example: f(x)= 4x+2 x 2 +4x−5 Example: f(x)= 4x+2 x 2 +4x−5

In this case, the end behavior is  f(x)≈ 4x x 2 = 4 x . f(x)≈ 4x x 2 = 4 x . This tells us that, as the inputs increase or decrease without bound, this function will behave similarly to the function  g(x)= 4 x , g(x)= 4 x , and the outputs will approach zero, resulting in a horizontal asymptote at  y=0. y=0. See [Figure 12](<3-7-rational-functions#Figure_03_07_013>). Note that this graph crosses the horizontal asymptote.

![Graph of f\(x\)=\(4x+2\)/\(x^2+4x-5\) with its vertical asymptotes at x=-5 and x=1 and its horizontal asymptote at y=0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d3bf6efe227802d8d66385831e864d1dd247228c) Figure  12 Horizontal Asymptote  y=0 y=0 when  f(x)= p(x) q(x) ,q(x)≠0where degree ofp<degreeofq. f(x)= p(x) q(x) ,q(x)≠0where degree ofp<degreeofq.

**Case 2:** If the degree of the denominator < degree of the numerator by one, we get a slant asymptote.

Example: f(x)= 3 x 2 −2x+1 x−1 Example: f(x)= 3 x 2 −2x+1 x−1

In this case, the end behavior is  f(x)≈ 3 x 2 x =3x. f(x)≈ 3 x 2 x =3x. This tells us that as the inputs increase or decrease without bound, this function will behave similarly to the function  g(x)=3x. g(x)=3x. As the inputs grow large, the outputs will grow and not level off, so this graph has no horizontal asymptote. However, the graph of  g(x)=3x g(x)=3x looks like a diagonal line, and since  f f will behave similarly to  g, g, it will approach a line close to  y=3x. y=3x. This line is a slant asymptote.

To find the equation of the slant asymptote, divide  3 x 2 −2x+1 x−1 . 3 x 2 −2x+1 x−1 . The quotient is  3x+1, 3x+1, and the remainder is 2. The slant asymptote is the graph of the line  g(x)=3x+1. g(x)=3x+1. See [Figure 13](<3-7-rational-functions#Figure_03_07_014>).

![Graph of f\(x\)=\(3x^2-2x+1\)/\(x-1\) with its vertical asymptote at x=1 and a slant asymptote aty=3x+1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a32e93b0648e2b97e8cae2aa17fb65e79f833731) Figure  13 Slant Asymptote when  f(x)= p(x) q(x) ,q(x)≠0 f(x)= p(x) q(x) ,q(x)≠0 where degree of  p>degree of qby1. p>degree of qby1.

**Case 3:** If the degree of the denominator = degree of the numerator, there is a horizontal asymptote at  y= a n b n , y= a n b n , where  a n a n and  b n b n are the leading coefficients of  p( x ) p( x ) and  q( x ) q( x ) for  f(x)= p(x) q(x) ,q(x)≠0. f(x)= p(x) q(x) ,q(x)≠0.

Example: f(x)= 3 x 2 +2 x 2 +4x−5 Example: f(x)= 3 x 2 +2 x 2 +4x−5

In this case, the end behavior is  f(x)≈ 3 x 2 x 2 =3. f(x)≈ 3 x 2 x 2 =3. This tells us that as the inputs grow large, this function will behave like the function  g(x)=3, g(x)=3, which is a horizontal line. As  x→±∞,f(x)→3, x→±∞,f(x)→3, resulting in a horizontal asymptote at  y=3. y=3. See [Figure 14](<3-7-rational-functions#Figure_03_07_015>). Note that this graph crosses the horizontal asymptote.

![Graph of f\(x\)=\(3x^2+2\)/\(x^2+4x-5\) with its vertical asymptotes at x=-5 and x=1 and its horizontal asymptote at y=3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c73ec38d6b04748fd480b9851b1ac9ad8b39dda3) Figure  14 Horizontal Asymptote when  f(x)= p(x) q(x) ,q(x)≠0where degree of p=degree of q. f(x)= p(x) q(x) ,q(x)≠0where degree of p=degree of q.

Notice that, while the graph of a rational function will never cross a vertical asymptote, the graph may or may not cross a horizontal or slant asymptote. Also, although the graph of a rational function may have many vertical asymptotes, the graph will have at most one horizontal (or slant) asymptote.

It should be noted that, if the degree of the numerator is larger than the degree of the denominator by more than one, the end behavior of the graph will mimic the behavior of the reduced end behavior fraction. For instance, if we had the function

f(x)= 3 x 5 − x 2 x+3 f(x)= 3 x 5 − x 2 x+3

with end behavior

f(x)≈ 3 x 5 x =3 x 4 , f(x)≈ 3 x 5 x =3 x 4 ,

the end behavior of the graph would look similar to that of an even polynomial with a positive leading coefficient.

x→±∞,f(x)→∞ x→±∞,f(x)→∞

###  Horizontal Asymptotes of Rational Functions

The horizontal asymptote of a rational function can be determined by looking at the degrees of the numerator and denominator.

  * Degree of numerator _is less than_ degree of denominator: horizontal asymptote at  y=0. y=0.
  * Degree of numerator _is greater than degree of denominator by one_ : no horizontal asymptote; slant asymptote.
  * Degree of numerator _is equal to_ degree of denominator: horizontal asymptote at ratio of leading coefficients.

###  Example  7

#### Identifying Horizontal and Slant Asymptotes

For the functions below, identify the horizontal or slant asymptote.

  1. ⓐ g(x)= 6 x 3 −10x 2 x 3 +5 x 2 g(x)= 6 x 3 −10x 2 x 3 +5 x 2
  2. ⓑ h(x)= x 2 −4x+1 x+2 h(x)= x 2 −4x+1 x+2
  3. ⓒ k(x)= x 2 +4x x 3 −8 k(x)= x 2 +4x x 3 −8

####  Solution

For these solutions, we will use  f(x)= p(x) q(x) ,q(x)≠0. f(x)= p(x) q(x) ,q(x)≠0.

  1. ⓐ g(x)= 6 x 3 −10x 2 x 3 +5 x 2 : g(x)= 6 x 3 −10x 2 x 3 +5 x 2 : The degree of  p=degree ofq=3, p=degree ofq=3, so we can find the horizontal asymptote by taking the ratio of the leading terms. There is a horizontal asymptote at  y= 6 2 y= 6 2 or  y=3. y=3.
  2. ⓑ h(x)= x 2 −4x+1 x+2 : h(x)= x 2 −4x+1 x+2 : The degree of  p=2 p=2 and degree of  q=1. q=1. Since  p>q p>q by 1, there is a slant asymptote found at  x 2 −4x+1 x+2 . x 2 −4x+1 x+2 .

-2 1 −4 1 −2 12 1 −6 13 -2 1 −4 1 −2 12 1 −6 13

The quotient is  x–6 x–6 and the remainder is 13. There is a slant asymptote at  y=x–6. y=x–6.

  3. ⓒ k(x)= x 2 +4x x 3 −8 : k(x)= x 2 +4x x 3 −8 : The degree of  p=2< p=2< degree of  q=3, q=3, so there is a horizontal asymptote  y=0. y=0.

###  Example  8

#### Identifying Horizontal Asymptotes

In the sugar concentration problem earlier, we created the equation  C(t)= 5+t 100+10t . C(t)= 5+t 100+10t .

Find the horizontal asymptote and interpret it in context of the problem.

####  Solution

Both the numerator and denominator are linear (degree 1). Because the degrees are equal, there will be a horizontal asymptote at the ratio of the leading coefficients. In the numerator, the leading term is  t, t, with coefficient 1. In the denominator, the leading term is  10t, 10t, with coefficient 10. The horizontal asymptote will be at the ratio of these values: 

t→∞,C(t)→ 1 10 t→∞,C(t)→ 1 10

This function will have a horizontal asymptote at  y= 1 10 . y= 1 10 .

This tells us that as the values of _t_ increase, the values of  C C will approach  1 10 . 1 10 . In context, this means that, as more time goes by, the concentration of sugar in the tank will approach one-tenth of a pound of sugar per gallon of water or  1 10 1 10 pounds per gallon.

###  Example  9

#### Identifying Horizontal and Vertical Asymptotes

Find the horizontal and vertical asymptotes of the function

f(x)= (x−2)(x+3) (x−1)(x+2)(x−5) f(x)= (x−2)(x+3) (x−1)(x+2)(x−5)

####  Solution

First, note that this function has no common factors, so there are no potential removable discontinuities. 

The function will have vertical asymptotes when the denominator is zero, causing the function to be undefined. The denominator will be zero at  x=1,–2,and 5, x=1,–2,and 5, indicating vertical asymptotes at these values.

The numerator has degree 2, while the denominator has degree 3. Since the degree of the denominator is greater than the degree of the numerator, the denominator will grow faster than the numerator, causing the outputs to tend towards zero as the inputs get large, and so as  x→±∞,f(x)→0. x→±∞,f(x)→0. This function will have a horizontal asymptote at  y=0. y=0. See [Figure 15](<3-7-rational-functions#Figure_03_07_016>).

![Graph of f\(x\)=\(x-2\)\(x+3\)/\(x-1\)\(x+2\)\(x-5\) with its vertical asymptotes at x=-2, x=1, and x=5 and its horizontal asymptote at y=0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f0bee616f6e8f3fc7e84094c4ded7ea87183c2a8) Figure  15

###  Try It  #6

Find the vertical and horizontal asymptotes of the function:

f(x)= (2x−1)(2x+1) (x−2)(x+3) f(x)= (2x−1)(2x+1) (x−2)(x+3)

###  Intercepts of Rational Functions

A rational function will have a _y_ -intercept when the input is zero, if the function is defined at zero. A rational function will not have a _y_ -intercept if the function is not defined at zero.

Likewise, a rational function will have _x_ -intercepts at the inputs that cause the output to be zero. Since a fraction is only equal to zero when the numerator is zero, _x_ -intercepts can only occur when the numerator of the rational function is equal to zero.

###  Example  10

#### Finding the Intercepts of a Rational Function

Find the intercepts of  f(x)= (x−2)(x+3) (x−1)(x+2)(x−5) . f(x)= (x−2)(x+3) (x−1)(x+2)(x−5) .

####  Solution

We can find the _y_ -intercept by evaluating the function at zero

f(0)= (0−2)(0+3) (0−1)(0+2)(0−5) = −6 10 =− 3 5 =−0.6 f(0)= (0−2)(0+3) (0−1)(0+2)(0−5) = −6 10 =− 3 5 =−0.6

The _x_ -intercepts will occur when the function is equal to zero:

0= (x−2)(x+3) (x−1)(x+2)(x−5) This is zero when the numerator is zero. 0=(x−2)(x+3) x=2,−3 0= (x−2)(x+3) (x−1)(x+2)(x−5) This is zero when the numerator is zero. 0=(x−2)(x+3) x=2,−3

The _y_ -intercept is  (0,–0.6), (0,–0.6), the _x_ -intercepts are  (2,0) (2,0) and  (–3,0). (–3,0). See [Figure 16](<3-7-rational-functions#Figure_03_07_017>).

![Graph of f\(x\)=\(x-2\)\(x+3\)/\(x-1\)\(x+2\)\(x-5\) with its vertical asymptotes at x=-2, x=1, and x=5, its horizontal asymptote at y=0, and its intercepts at \(-3, 0\), \(0, -0.6\), and \(2, 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/81d6b0ee6bdc1d31e3b7d7cad58b7b165ecc57b2) Figure  16

###  Try It  #7

Given the reciprocal squared function that is shifted right 3 units and down 4 units, write this as a rational function. Then, find the _x_ \- and _y_ -intercepts and the horizontal and vertical asymptotes.

### Graphing Rational Functions

In [Example 9](<3-7-rational-functions#Example_03_07_09>), we see that the numerator of a rational function reveals the _x_ -intercepts of the graph, whereas the denominator reveals the vertical asymptotes of the graph. As with polynomials, factors of the numerator may have integer powers greater than one. Fortunately, the effect on the shape of the graph at those intercepts is the same as we saw with polynomials.

The vertical asymptotes associated with the factors of the denominator will mirror one of the two toolkit reciprocal functions. When the degree of the factor in the denominator is odd, the distinguishing characteristic is that on one side of the vertical asymptote the graph heads towards positive infinity, and on the other side the graph heads towards negative infinity. See [Figure 17](<3-7-rational-functions#Figure_03_07_019>).

![Graph of y=1/x with its vertical asymptote at x=0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ef9e8ee9b58a96ee7d8f5a8d8f9d7be50333e93a) Figure  17

When the degree of the factor in the denominator is even, the distinguishing characteristic is that the graph either heads toward positive infinity on both sides of the vertical asymptote or heads toward negative infinity on both sides. See [Figure 18](<3-7-rational-functions#Figure_03_07_018>).

![Graph of y=1/x^2 with its vertical asymptote at x=0.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/07e7b212fc330186f4867772281e66931e4b191a) Figure  18

For example, the graph of  f(x)= (x+1) 2 (x−3) (x+3) 2 (x−2) f(x)= (x+1) 2 (x−3) (x+3) 2 (x−2) is shown in [Figure 19](<3-7-rational-functions#Figure_03_07_020>).

![Graph of f\(x\)=\(x+1\)^2\(x-3\)/\(x+3\)^2\(x-2\) with its vertical asymptotes at x=-3 and x=2, its horizontal asymptote at y=1, and its intercepts at \(-1, 0\), \(0, 1/6\), and \(3, 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/bad8920be5ab68157f82a52b833a778d03dfd482) Figure  19

  * At the _x_ -intercept  x=−1 x=−1 corresponding to the  (x+1) 2 (x+1) 2 factor of the numerator, the graph bounces, consistent with the quadratic nature of the factor.
  * At the _x_ -intercept  x=3 x=3 corresponding to the  (x−3) (x−3) factor of the numerator, the graph passes through the axis as we would expect from a linear factor.
  * At the vertical asymptote  x=−3 x=−3 corresponding to the  (x+3) 2 (x+3) 2 factor of the denominator, the graph heads towards positive infinity on both sides of the asymptote, consistent with the behavior of the function  f(x)= 1 x 2 . f(x)= 1 x 2 .
  * At the vertical asymptote  x=2, x=2, corresponding to the  (x−2) (x−2) factor of the denominator, the graph heads towards positive infinity on the left side of the asymptote and towards negative infinity on the right side.

###  How To

**Given a rational function, sketch a graph.**

  1. Evaluate the function at 0 to find the _y_ -intercept.
  2. Factor the numerator and denominator.
  3. For factors in the numerator not common to the denominator, determine where each factor of the numerator is zero to find the _x_ -intercepts.
  4. Find the multiplicities of the _x_ -intercepts to determine the behavior of the graph at those points.
  5. For factors in the denominator, note the multiplicities of the zeros to determine the local behavior. For those factors not common to the numerator, find the vertical asymptotes by setting those factors equal to zero and then solve.
  6. For factors in the denominator common to factors in the numerator, find the removable discontinuities by setting those factors equal to 0 and then solve.
  7. Compare the degrees of the numerator and the denominator to determine the horizontal or slant asymptotes.
  8. Sketch the graph.

###  Example  11

#### Graphing a Rational Function

Sketch a graph of  f(x)= (x+2)(x−3) (x+1) 2 (x−2) . f(x)= (x+2)(x−3) (x+1) 2 (x−2) .

####  Solution

We can start by noting that the function is already factored, saving us a step.

Next, we will find the intercepts. Evaluating the function at zero gives the _y_ -intercept:

f(0)= (0+2)(0−3) (0+1) 2 (0−2) =3 f(0)= (0+2)(0−3) (0+1) 2 (0−2) =3

To find the _x_ -intercepts, we determine when the numerator of the function is zero. Setting each factor equal to zero, we find _x_ -intercepts at  x=–2 x=–2 and  x=3. x=3. At each, the behavior will be linear (multiplicity 1), with the graph passing through the intercept.

We have a _y_ -intercept at  (0,3) (0,3) and _x_ -intercepts at  (–2,0) (–2,0) and  (3,0). (3,0).

To find the vertical asymptotes, we determine when the denominator is equal to zero. This occurs when  x+1=0 x+1=0 and when  x–2=0, x–2=0, giving us vertical asymptotes at  x=–1 x=–1 and  x=2. x=2.

There are no common factors in the numerator and denominator. This means there are no removable discontinuities.

Finally, the degree of denominator is larger than the degree of the numerator, telling us this graph has a horizontal asymptote at  y=0. y=0.

To sketch the graph, we might start by plotting the three intercepts. Since the graph has no _x_ -intercepts between the vertical asymptotes, and the _y_ -intercept is positive, we know the function must remain positive between the asymptotes, letting us fill in the middle portion of the graph as shown in [Figure 20](<3-7-rational-functions#Figure_03_07_021>).

![Graph of only the middle portion of f\(x\)=\(x+2\)\(x-3\)/\(x+1\)^2\(x-2\) with its intercepts at \(-2, 0\), \(0, 3\), and \(3, 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/029c4e333e96cc9f3b0e5fe0f04074ad32e2f2ee) Figure  20

The factor associated with the vertical asymptote at  x=−1 x=−1 was squared, so we know the behavior will be the same on both sides of the asymptote. The graph heads toward positive infinity as the inputs approach the asymptote on the right, so the graph will head toward positive infinity on the left as well.

For the vertical asymptote at  x=2, x=2, the factor was not squared, so the graph will have opposite behavior on either side of the asymptote. See [Figure 21](<3-7-rational-functions#Figure_03_07_022>). After passing through the _x_ -intercepts, the graph will then level off toward an output of zero, as indicated by the horizontal asymptote.

![Graph of f\(x\)=\(x+2\)\(x-3\)/\(x+1\)^2\(x-2\) with its vertical asymptotes at x=-1 and x=2, its horizontal asymptote at y=0, and its intercepts at \(-2, 0\), \(0, 3\), and \(3, 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b2a23ab01d67a9a9505246d9baa78a4639f18404) Figure  21

###  Try It  #8

Given the function  f(x)= (x+2) 2 (x−2) 2 (x−1) 2 (x−3) , f(x)= (x+2) 2 (x−2) 2 (x−1) 2 (x−3) , use the characteristics of polynomials and rational functions to describe its behavior and sketch the function.

### Writing Rational Functions

Now that we have analyzed the equations for rational functions and how they relate to a graph of the function, we can use information given by a graph to write the function. A rational function written in factored form will have an _x_ -intercept where each factor of the numerator is equal to zero. (An exception occurs in the case of a removable discontinuity.) As a result, we can form a numerator of a function whose graph will pass through a set of _x_ -intercepts by introducing a corresponding set of factors. Likewise, because the function will have a vertical asymptote where each factor of the denominator is equal to zero, we can form a denominator that will produce the vertical asymptotes by introducing a corresponding set of factors.

###  Writing Rational Functions from Intercepts and Asymptotes

If a rational function has _x_ -intercepts at  x= x 1 , x 2 ,..., x n , x= x 1 , x 2 ,..., x n , vertical asymptotes at  x= v 1 , v 2 ,…, v m , x= v 1 , v 2 ,…, v m , and no  x i =any  v j , x i =any  v j , then the function can be written in the form:

f(x)=a (x− x 1 ) p 1 (x− x 2 ) p 2 ⋯ (x− x n ) p n (x− v 1 ) q 1 (x− v 2 ) q 2 ⋯ (x− v m ) q m f(x)=a (x− x 1 ) p 1 (x− x 2 ) p 2 ⋯ (x− x n ) p n (x− v 1 ) q 1 (x− v 2 ) q 2 ⋯ (x− v m ) q m

where the powers  p i p i or  q i q i on each factor can be determined by the behavior of the graph at the corresponding intercept or asymptote, and the stretch factor  a a can be determined given a value of the function other than the _x_ -intercept or by the horizontal asymptote if it is nonzero.

###  How To

**Given a graph of a rational function, write the function.**

  1. Determine the factors of the numerator. Examine the behavior of the graph at the _x_ -intercepts to determine the zeroes and their multiplicities. (This is easy to do when finding the “simplest” function with small multiplicities—such as 1 or 3—but may be difficult for larger multiplicities—such as 5 or 7, for example.)
  2. Determine the factors of the denominator. Examine the behavior on both sides of each vertical asymptote to determine the factors and their powers.
  3. Use any clear point on the graph to find the stretch factor.

###  Example  12

#### Writing a Rational Function from Intercepts and Asymptotes

Write an equation for the rational function shown in [Figure 22](<3-7-rational-functions#Figure_03_07_024>).

![Graph of a rational function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/743f8554e8113278f5ba6311deec40eef22b71ae) Figure  22

####  Solution

The graph appears to have _x_ -intercepts at  x=–2 x=–2 and  x=3. x=3. At both, the graph passes through the intercept, suggesting linear factors. The graph has two vertical asymptotes. The one at  x=–1 x=–1 seems to exhibit the basic behavior similar to  1 x , 1 x , with the graph heading toward positive infinity on one side and heading toward negative infinity on the other. The asymptote at  x=2 x=2 is exhibiting a behavior similar to  1 x 2 , 1 x 2 , with the graph heading toward negative infinity on both sides of the asymptote. See [Figure 23](<3-7-rational-functions#Figure_03_07_025>).

![Graph of a rational function denoting its vertical asymptotes and x-intercepts.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3843bbc696526fb97a9c8973475f5feac07b0995) Figure  23

We can use this information to write a function of the form

f(x)=a (x+2)(x−3) (x+1) (x−2) 2 . f(x)=a (x+2)(x−3) (x+1) (x−2) 2 .

To find the stretch factor, we can use another clear point on the graph, such as the _y_ -intercept  (0,–2). (0,–2).

−2=a (0+2)(0−3) (0+1) (0−2) 2 −2=a −6 4 a= −8 −6 = 4 3 −2=a (0+2)(0−3) (0+1) (0−2) 2 −2=a −6 4 a= −8 −6 = 4 3

This gives us a final function of  f(x)= 4(x+2)(x−3) 3(x+1) (x−2) 2 . f(x)= 4(x+2)(x−3) 3(x+1) (x−2) 2 .

###  Media

Access these online resources for additional instruction and practice with rational functions.

  * [Graphing Rational Functions](<http://openstax.org/l/graphrational>)
  * [Find the Equation of a Rational Function](<http://openstax.org/l/equatrational>)
  * [Determining Vertical and Horizontal Asymptotes](<http://openstax.org/l/asymptote>)
  * [Find the Intercepts, Asymptotes, and Hole of a Rational Function](<http://openstax.org/l/interasymptote>)

###  3.7 Section Exercises

#### Verbal

[1](<chapter-3>). 

What is the fundamental difference in the algebraic representation of a polynomial function and a rational function?

2. 

What is the fundamental difference in the graphs of polynomial functions and rational functions?

[3](<chapter-3>). 

If the graph of a rational function has a removable discontinuity, what must be true of the functional rule?

4. 

Can a graph of a rational function have no vertical asymptote? If so, how?

[5](<chapter-3>). 

Can a graph of a rational function have no _x_ -intercepts? If so, how?

#### Algebraic

For the following exercises, find the domain of the rational functions.

6. 

f(x)= x−1 x+2 f(x)= x−1 x+2

[7](<chapter-3>). 

f(x)= x+1 x 2 −1 f(x)= x+1 x 2 −1

8. 

f(x)= x 2 +4 x 2 −2x−8 f(x)= x 2 +4 x 2 −2x−8

[9](<chapter-3>). 

f(x)= x 2 +4x−3 x 4 −5 x 2 +4 f(x)= x 2 +4x−3 x 4 −5 x 2 +4

For the following exercises, find the domain, vertical asymptotes, and horizontal asymptotes of the functions.

10. 

f(x)= 4 x−1 f(x)= 4 x−1

[11](<chapter-3>). 

f( x )= 2 5x+2 f( x )= 2 5x+2

12. 

f(x)= x x 2 −9 f(x)= x x 2 −9

[13](<chapter-3>). 

f(x)= x x 2 +5x−36 f(x)= x x 2 +5x−36

14. 

f( x )= 3+x x 3 −27 f( x )= 3+x x 3 −27

[15](<chapter-3>). 

f(x)= 3x−4 x 3 −16x f(x)= 3x−4 x 3 −16x

16. 

f(x)= x 2 −1 x 3 +9 x 2 +14x f(x)= x 2 −1 x 3 +9 x 2 +14x

[17](<chapter-3>). 

f(x)= x+5 x 2 −25 f(x)= x+5 x 2 −25

18. 

f(x)= x−4 x−6 f(x)= x−4 x−6

[19](<chapter-3>). 

f( x )= 4−2x 3x−1 f( x )= 4−2x 3x−1

For the following exercises, find the _x_ \- and _y_ -intercepts for the functions.

20. 

f(x)= x+5 x 2 +4 f(x)= x+5 x 2 +4

[21](<chapter-3>). 

f(x)= x x 2 −x f(x)= x x 2 −x

22. 

f(x)= x 2 +8x+7 x 2 +11x+30 f(x)= x 2 +8x+7 x 2 +11x+30

[23](<chapter-3>). 

f(x)= x 2 +x+6 x 2 −10x+24 f(x)= x 2 +x+6 x 2 −10x+24

24. 

f(x)= 94−2 x 2 3 x 2 −12 f(x)= 94−2 x 2 3 x 2 −12

For the following exercises, describe the local and end behavior of the functions.

[25](<chapter-3>). 

f( x )= x 2x+1 f( x )= x 2x+1

26. 

f( x )= 2x x−6 f( x )= 2x x−6

[27](<chapter-3>). 

f( x )= −2x x−6 f( x )= −2x x−6

28. 

f( x )= x 2 −4x+3 x 2 −4x−5 f( x )= x 2 −4x+3 x 2 −4x−5

[29](<chapter-3>). 

f( x )= 2 x 2 −32 6 x 2 +13x−5 f( x )= 2 x 2 −32 6 x 2 +13x−5

For the following exercises, find the slant asymptote of the functions.

30. 

f(x)= 24 x 2 +6x 2x+1 f(x)= 24 x 2 +6x 2x+1

[31](<chapter-3>). 

f(x)= 4 x 2 −10 2x−4 f(x)= 4 x 2 −10 2x−4

32. 

f(x)= 81 x 2 −18 3x−2 f(x)= 81 x 2 −18 3x−2

[33](<chapter-3>). 

f(x)= 6 x 3 −5x 3 x 2 +4 f(x)= 6 x 3 −5x 3 x 2 +4

34. 

f(x)= x 2 +5x+4 x−1 f(x)= x 2 +5x+4 x−1

#### Graphical

For the following exercises, use the given transformation to graph the function. Note the vertical and horizontal asymptotes.

[35](<chapter-3>). 

The reciprocal function shifted up two units.

36. 

The reciprocal function shifted down one unit and left three units.

[37](<chapter-3>). 

The reciprocal squared function shifted to the right 2 units.

38. 

The reciprocal squared function shifted down 2 units and right 1 unit.

For the following exercises, find the horizontal intercepts, the vertical intercept, the vertical asymptotes, and the horizontal or slant asymptote of the functions. Use that information to sketch a graph.

[39](<chapter-3>). 

p( x )= 2x−3 x+4 p( x )= 2x−3 x+4

40. 

q( x )= x−5 3x−1 q( x )= x−5 3x−1

[41](<chapter-3>). 

s( x )= 4 ( x−2 ) 2 s( x )= 4 ( x−2 ) 2

42. 

r( x )= 5 ( x+1 ) 2 r( x )= 5 ( x+1 ) 2

[43](<chapter-3>). 

f( x )= 3 x 2 −14x−5 3 x 2 +8x−16 f( x )= 3 x 2 −14x−5 3 x 2 +8x−16

44. 

g( x )= 2 x 2 +7x−15 3 x 2 −14x+15 g( x )= 2 x 2 +7x−15 3 x 2 −14x+15

[45](<chapter-3>). 

a( x )= x 2 +2x−3 x 2 −1 a( x )= x 2 +2x−3 x 2 −1

46. 

b( x )= x 2 −x−6 x 2 −4 b( x )= x 2 −x−6 x 2 −4

[47](<chapter-3>). 

h( x )= 2 x 2 +x−1 x−4 h( x )= 2 x 2 +x−1 x−4

48. 

k( x )= 2 x 2 −3x−20 x−5 k( x )= 2 x 2 −3x−20 x−5

[49](<chapter-3>). 

w( x )= ( x−1 )( x+3 )( x−5 ) ( x+2 ) 2 (x−4) w( x )= ( x−1 )( x+3 )( x−5 ) ( x+2 ) 2 (x−4)

50. 

z( x )= ( x+2 ) 2 ( x−5 ) ( x−3 )( x+1 )( x+4 ) z( x )= ( x+2 ) 2 ( x−5 ) ( x−3 )( x+1 )( x+4 )

For the following exercises, write an equation for a rational function with the given characteristics.

[51](<chapter-3>). 

Vertical asymptotes at  x=5 x=5 and  x=−5, x=−5, _x_ -intercepts at  (2,0) (2,0) and  (−1,0), (−1,0), _y_ -intercept at  ( 0,4 ) ( 0,4 )

52. 

Vertical asymptotes at  x=−4 x=−4 and  x=−1, x=−1, _x-_ intercepts at  ( 1,0 ) ( 1,0 ) and  ( 5,0 ), ( 5,0 ), _y-_ intercept at  (0,7) (0,7)

[53](<chapter-3>). 

Vertical asymptotes at  x=−4 x=−4 and  x=−5, x=−5, _x_ -intercepts at  ( 4,0 ) ( 4,0 ) and  ( −6,0 ), ( −6,0 ), Horizontal asymptote at  y=7 y=7

54. 

Vertical asymptotes at  x=−3 x=−3 and  x=6, x=6, _x_ -intercepts at  ( −2,0 ) ( −2,0 ) and  ( 1,0 ), ( 1,0 ), Horizontal asymptote at  y=−2 y=−2

[55](<chapter-3>). 

Vertical asymptote at  x=−1, x=−1, Double zero at  x=2, x=2, _y_ -intercept at  (0,2) (0,2)

56. 

Vertical asymptote at  x=3, x=3, Double zero at  x=1, x=1, _y_ -intercept at  (0,4) (0,4)

For the following exercises, use the graphs to write an equation for the function.

[57](<chapter-3>). 

![Graph of a rational function with vertical asymptotes at x=-3 and x=4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a61cd8aa12673f2b8f11f5707bc38d562df88f1d)

58. 

![Graph of a rational function with vertical asymptotes at x=-3 and x=4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cf0a69ff96314d09fe08c5a445e40cacb7099e98)

[59](<chapter-3>). 

![Graph of a rational function with vertical asymptotes at x=-3 and x=3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3533949f2aa521113155f69bff0ab495e0cd6687)

60. 

![Graph of a rational function with vertical asymptotes at x=-3 and x=4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/40ee2842549d2c2f462d50ecb5d2e8c8948480ff)

[61](<chapter-3>). 

![Graph of a rational function with vertical asymptote at x=1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7cfe5f96970df558906cf60c9ca578feafc49aa1)

62. 

![Graph of a rational function with vertical asymptote at x=-2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/eeac3aa5f237664a04997293c01f5229d032fa53)

[63](<chapter-3>). 

![Graph of a rational function with vertical asymptotes at x=-3 and x=2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fae7e1ff7940b51da6c6f8a822c05444dc7b1d86)

64. 

![Graph of a rational function with vertical asymptotes at x=-2 and x=4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/460f0e208e7b2b3cb9285c8c724a287faebaeee7)

#### Numeric

For the following exercises, make tables to show the behavior of the function near the vertical asymptote and reflecting the horizontal asymptote

[65](<chapter-3>). 

f(x)= 1 x−2 f(x)= 1 x−2

66. 

f(x)= x x−3 f(x)= x x−3

[67](<chapter-3>). 

f(x)= 2x x+4 f(x)= 2x x+4

68. 

f(x)= 2x (x−3) 2 f(x)= 2x (x−3) 2

[69](<chapter-3>). 

f(x)= x 2 x 2 +2x+1 f(x)= x 2 x 2 +2x+1

#### Technology

For the following exercises, use a calculator to graph  f( x ). f( x ). Use the graph to solve  f( x )>0. f( x )>0.

70. 

f(x)= 2 x+1 f(x)= 2 x+1

[71](<chapter-3>). 

f(x)= 4 2x−3 f(x)= 4 2x−3

72. 

f(x)= 2 ( x−1 )( x+2 ) f(x)= 2 ( x−1 )( x+2 )

[73](<chapter-3>). 

f(x)= x+2 ( x−1 )( x−4 ) f(x)= x+2 ( x−1 )( x−4 )

74. 

f(x)= (x+3) 2 ( x−1 ) 2 ( x+1 ) f(x)= (x+3) 2 ( x−1 ) 2 ( x+1 )

#### Extensions

For the following exercises, identify the removable discontinuity.

[75](<chapter-3>). 

f(x)= x 2 −4 x−2 f(x)= x 2 −4 x−2

76. 

f(x)= x 3 +1 x+1 f(x)= x 3 +1 x+1

[77](<chapter-3>). 

f(x)= x 2 +x−6 x−2 f(x)= x 2 +x−6 x−2

78. 

f(x)= 2 x 2 +5x−3 x+3 f(x)= 2 x 2 +5x−3 x+3

[79](<chapter-3>). 

f(x)= x 3 + x 2 x+1 f(x)= x 3 + x 2 x+1

#### Real-World Applications

For the following exercises, express a rational function that describes the situation.

80. 

A large mixing tank currently contains 200 gallons of water, into which 10 pounds of sugar have been mixed. A tap will open, pouring 10 gallons of water per minute into the tank at the same time sugar is poured into the tank at a rate of 3 pounds per minute. Find the concentration (pounds per gallon) of sugar in the tank after  t t minutes.

[81](<chapter-3>). 

A large mixing tank currently contains 300 gallons of water, into which 8 pounds of sugar have been mixed. A tap will open, pouring 20 gallons of water per minute into the tank at the same time sugar is poured into the tank at a rate of 2 pounds per minute. Find the concentration (pounds per gallon) of sugar in the tank after  t t minutes.

For the following exercises, use the given rational function to answer the question.

82. 

The concentration  C C of a drug in a patient’s bloodstream  t t hours after injection in given by  C(t)= 2t 3+ t 2 . C(t)= 2t 3+ t 2 . What happens to the concentration of the drug as  t t increases?

[83](<chapter-3>). 

The concentration  C C of a drug in a patient’s bloodstream t t hours after injection is given by  C(t)= 100t 2 t 2 +75 . C(t)= 100t 2 t 2 +75 . Use a calculator to approximate the time when the concentration is highest.

For the following exercises, construct a rational function that will help solve the problem. Then, use a calculator to answer the question.

84. 

An open box with a square base is to have a volume of 108 cubic inches. Find the dimensions of the box that will have minimum surface area. Let  x x = length of the side of the base.

[85](<chapter-3>). 

A rectangular box with a square base is to have a volume of 20 cubic feet. The material for the base costs 30 cents/ square foot. The material for the sides costs 10 cents/square foot. The material for the top costs 20 cents/square foot. Determine the dimensions that will yield minimum cost. Let  x x = length of the side of the base.

86. 

A right circular cylinder has volume of 100 cubic inches. Find the radius and height that will yield minimum surface area. Let  x x = radius.

[87](<chapter-3>). 

A right circular cylinder with no top has a volume of 50 cubic meters. Find the radius that will yield minimum surface area. Let  x x = radius.

88. 

A right circular cylinder is to have a volume of 40 cubic inches. It costs 4 cents/square inch to construct the top and bottom and 1 cent/square inch to construct the rest of the cylinder. Find the radius to yield minimum cost. Let  x x = radius.


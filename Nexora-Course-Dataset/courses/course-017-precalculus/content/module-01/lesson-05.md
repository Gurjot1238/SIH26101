# 1.5 Transformation of Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/1-5-transformation-of-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 1.5 Transformation of Functions

### Learning Objectives

In this section, you will:

  * Graph functions using vertical and horizontal shifts.
  * Graph functions using reflections about the  x x -axis and the  y y -axis.
  * Determine whether a function is even, odd, or neither from its graph.
  * Graph functions using compressions and stretches.
  * Combine transformations.

![Figure_01_05_038](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/bce2523f2172eb38588e6de32523bc502032340d) Figure  1 (credit: "Misko"/Flickr)

We all know that a flat mirror enables us to see an accurate image of ourselves and whatever is behind us. When we tilt the mirror, the images we see may shift horizontally or vertically. But what happens when we bend a flexible mirror? Like a carnival funhouse mirror, it presents us with a distorted image of ourselves, stretched or compressed horizontally or vertically. In a similar way, we can distort or transform mathematical functions to better adapt them to describing objects or processes in the real world. In this section, we will take a look at several kinds of transformations.

### Graphing Functions Using Vertical and Horizontal Shifts

Often when given a problem, we try to model the scenario using mathematics in the form of words, tables, graphs, and equations. One method we can employ is to adapt the basic graphs of the toolkit functions to build new models for a given scenario. There are systematic ways to alter functions to construct appropriate models for the problems we are trying to solve.

#### Identifying Vertical Shifts

One simple kind of transformation involves shifting the entire graph of a function up, down, right, or left. The simplest shift is a **vertical shift** , moving the graph up or down, because this transformation involves adding a positive or negative constant to the function. In other words, we add the same constant to the output value of the function regardless of the input. For a function  g(x)=f(x)+k, g(x)=f(x)+k, the function  f( x ) f( x ) is shifted vertically  k k units. See [Figure 2](<1-5-transformation-of-functions#Figure_01_05_002>) for an example.

![Figure_01_05_001](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a86adbf4ef2b47d86dcfede403f9a520b8d622a4) Figure  2 Vertical shift by  k=1 k=1 of the cube root function  f(x)= x 3 . f(x)= x 3 .

To help you visualize the concept of a vertical shift, consider that  y=f( x ). y=f( x ). Therefore,  f( x )+k f( x )+k is equivalent to  y+k. y+k. Every unit of  y y is replaced by  y+k, y+k, so the  y- y- value increases or decreases depending on the value of  k. k. The result is a shift upward or downward.

###  Vertical Shift

Given a function  f( x ), f( x ), a new function  g(x)=f(x)+k, g(x)=f(x)+k, where  k k is a constant, is a vertical shift of the function  f( x ). f( x ). All the output values change by  k k units. If  k k is positive, the graph will shift up. If  k k is negative, the graph will shift down.

###  Example  1

#### Adding a Constant to a Function

To regulate temperature in a green building, airflow vents near the roof open and close throughout the day. [Figure 3](<1-5-transformation-of-functions#Figure_01_05_003>) shows the area of open vents  V V (in square feet) throughout the day in hours after midnight,  t. t. During the summer, the facilities manager decides to try to better regulate temperature by increasing the amount of open vents by 20 square feet throughout the day and night. Sketch a graph of this new function.

![Figure_01_05_002](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9f6f1f40ca500266763e8a19b5a465230681a1d0) Figure  3

####  Solution

We can sketch a graph of this new function by adding 20 to each of the output values of the original function. This will have the effect of shifting the graph vertically up, as shown in [Figure 4](<1-5-transformation-of-functions#Figure_01_05_004>).

![Figure_01_05_003a](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ef6cc2fe661026012a3c0344caeba5ecd18c9094) Figure  4

Notice that in [Figure 4](<1-5-transformation-of-functions#Figure_01_05_004>), for each input value, the output value has increased by 20, so if we call the new function  S( t ), S( t ), we could write

S(t)=V(t)+20 S(t)=V(t)+20

This notation tells us that, for any value of  t,S(t) t,S(t) can be found by evaluating the function  V V at the same input and then adding 20 to the result. This defines  S S as a transformation of the function  V, V, in this case a vertical shift up 20 units. Notice that, with a vertical shift, the input values stay the same and only the output values change. See [Table 1](<1-5-transformation-of-functions#Table_01_05_018>).

** t t ** | 0 | 8 | 10 | 17 | 19 | 24  
---|---|---|---|---|---|---  
** V(t) V(t) ** | 0 | 0 | 220 | 220 | 0 | 0  
** S( t ) S( t ) ** | 20 | 20 | 240 | 240 | 20 | 20  
  
Table  1

###  How To

**Given a tabular function, create a new row to represent a vertical shift.**

  1. Identify the output row or column.
  2. Determine the magnitude of the shift.
  3. Add the shift to the value in each output cell. Add a positive value for up or a negative value for down.

###  Example  2

#### Shifting a Tabular Function Vertically

A function  f( x ) f( x ) is given in [Table 2](<1-5-transformation-of-functions#Table_01_05_01>). Create a table for the function  g(x)=f(x)−3. g(x)=f(x)−3.

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x) f(x) ** | 1 | 3 | 7 | 11  
  
Table  2

####  Solution

The formula  g(x)=f(x)−3 g(x)=f(x)−3 tells us that we can find the output values of  g g by subtracting 3 from the output values of  f. f. For example:

f(2)=1 Given g(x)=f(x)−3 Given transformation g(2)=f(2)−3 =1−3 =−2 f(2)=1 Given g(x)=f(x)−3 Given transformation g(2)=f(2)−3 =1−3 =−2

Subtracting 3 from each  f( x ) f( x ) value, we can complete a table of values for  g( x ) g( x ) as shown in [Table 3](<1-5-transformation-of-functions#Table_01_05_02>).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x) f(x) ** | 1 | 3 | 7 | 11  
** g(x) g(x) ** | −2 | 0 | 4 | 8  
  
Table  3

#### Analysis 

As with the earlier vertical shift, notice the input values stay the same and only the output values change.

###  Try It  #1

The function  h(t)=−4.9 t 2 +30t h(t)=−4.9 t 2 +30t gives the height  h h of a ball (in meters) thrown upward from the ground after  t t seconds. Suppose the ball was instead thrown from the top of a 10-m building. Relate this new height function  b(t) b(t) to  h(t), h(t), and then find a formula for  b(t). b(t).

#### Identifying Horizontal Shifts

We just saw that the vertical shift is a change to the output, or outside, of the function. We will now look at how changes to input, on the inside of the function, change its graph and meaning. A shift to the input results in a movement of the graph of the function left or right in what is known as a **horizontal shift** , shown in [Figure 5](<1-5-transformation-of-functions#Figure_01_05_005>).

![Figure_01_05_004](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3d3fb466a6ee2a23a33d6b1280162fcc323a1cad) Figure  5 Horizontal shift of the function  f(x)= x 3 . f(x)= x 3 . Note that  (x+1)(x+1) means h=-1 h=-1 which shifts the graph to the left, that is, towards _negative_ values of  x. x.

For example, if  f(x)= x 2 , f(x)= x 2 , then  g(x)= (x−2) 2 g(x)= (x−2) 2 is a new function. Each input is reduced by 2 prior to squaring the function. The result is that the graph is shifted 2 units to the right, because we would need to increase the prior input by 2 units to yield the same output value as given in  f. f.

###  Horizontal Shift

Given a function  f, f, a new function  g( x )=f( x−h ), g( x )=f( x−h ), where  h h is a constant, is a horizontal shift of the function  f. f. If  h h is positive, the graph will shift right. If  h h is negative, the graph will shift left.

###  Example  3

#### Adding a Constant to an Input

Returning to our building airflow example from [Figure 3](<1-5-transformation-of-functions#Figure_01_05_003>), suppose that in autumn the facilities manager decides that the original venting plan starts too late, and wants to begin the entire venting program 2 hours earlier. Sketch a graph of the new function.

####  Solution

We can set  V( t ) V( t ) to be the original program and  F( t ) F( t ) to be the revised program.

V( t )= the original venting plan F( t )=starting 2 hrs sooner V( t )= the original venting plan F( t )=starting 2 hrs sooner

In the new graph, at each time, the airflow is the same as the original function  V V was 2 hours later. For example, in the original function  V, V, the airflow starts to change at 8 a.m., whereas for the function  F, F, the airflow starts to change at 6 a.m. The comparable function values are  V(8)=F(6). V(8)=F(6). See [Figure 6](<1-5-transformation-of-functions#Figure_01_05_006>). Notice also that the vents first opened to  220 ft 2 220 ft 2 at 10 a.m. under the original plan, while under the new plan the vents reach  220 ft 2 220 ft 2 at 8 a.m., so  V(10)=F(8). V(10)=F(8).

In both cases, we see that, because  F( t ) F( t ) starts 2 hours sooner,  h=−2. h=−2. That means that the same output values are reached when  F(t)=V(t−( −2 ))=V( t+2 ). F(t)=V(t−( −2 ))=V( t+2 ).

![Figure_01_05_005a](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c689e97abffa808d23cfe47fbfc1ed2f2e05a6fa) Figure  6

#### Analysis 

Note that  V(t+2) V(t+2) has the effect of shifting the graph to the _left_.

Horizontal changes or “inside changes” affect the domain of a function (the input) instead of the range and often seem counterintuitive. The new function  F( t ) F( t ) uses the same outputs as  V( t ), V( t ), but matches those outputs to inputs 2 hours earlier than those of  V( t ). V( t ). Said another way, we must add 2 hours to the input of  V V to find the corresponding output for  F:F(t)=V(t+2). F:F(t)=V(t+2).

###  How To

**Given a tabular function, create a new row to represent a horizontal shift.**

  1. Identify the input row or column.
  2. Determine the magnitude of the shift.
  3. Add the shift to the value in each input cell.

###  Example  4

#### Shifting a Tabular Function Horizontally

A function  f(x) f(x) is given in [Table 4](<1-5-transformation-of-functions#Table_01_05_03>). Create a table for the function  g(x)=f(x−3). g(x)=f(x−3).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x) f(x) ** | 1 | 3 | 7 | 11  
  
Table  4

####  Solution

The formula  g(x)=f(x−3) g(x)=f(x−3) tells us that the output values of  g g are the same as the output value of  f f when the input value is 3 less than the original value. For example, we know that  f(2)=1. f(2)=1. To get the same output from the function  g, g, we will need an input value that is 3 _larger_. We input a value that is 3 larger for  g(x) g(x) because the function takes 3 away before evaluating the function  f. f.

g(5)=f(5−3) =f(2) =1 g(5)=f(5−3) =f(2) =1

We continue with the other values to create [Table 5](<1-5-transformation-of-functions#Table_01_05_04>).

** x x ** | 5 | 7 | 9 | 11  
---|---|---|---|---  
** x−3 x−3 ** | 2 | 4 | 6 | 8  
** f(x−3) f(x−3) ** | 1 | 3 | 7 | 11  
** g(x) g(x) ** | 1 | 3 | 7 | 11  
  
Table  5

The result is that the function  g(x) g(x) has been shifted to the right by 3. Notice the output values for  g(x) g(x) remain the same as the output values for  f(x), f(x), but the corresponding input values,  x, x, have shifted to the right by 3. Specifically, 2 shifted to 5, 4 shifted to 7, 6 shifted to 9, and 8 shifted to 11.

#### Analysis 

[Figure 7](<1-5-transformation-of-functions#Figure_01_05_007>) represents both of the functions. We can see the horizontal shift in each point.

![Graph of the points from the previous table for f\(x\) and g\(x\)=f\(x-3\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0f6817b60a22fa0b560aa21c3107e2332053af90) Figure  7

###  Example  5

#### Identifying a Horizontal Shift of a Toolkit Function

[Figure 8](<1-5-transformation-of-functions#Figure_01_05_008>) represents a transformation of the toolkit function  f(x)= x 2 . f(x)= x 2 . Relate this new function  g(x) g(x) to  f(x), f(x), and then find a formula for  g(x). g(x).

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f2ce014253d253a241c75a2be2217eebb2378092) Figure  8

####  Solution

Notice that the graph is identical in shape to the  f(x)= x 2 f(x)= x 2 function, but the _x-_ values are shifted to the right 2 units. The vertex used to be at (0,0), but now the vertex is at (2,0). The graph is the basic quadratic function shifted 2 units to the right, so

g(x)=f(x−2) g(x)=f(x−2)

Notice how we must input the value  x=2 x=2 to get the output value  y=0; y=0; the _x_ -values must be 2 units larger because of the shift to the right by 2 units. We can then use the definition of the  f(x) f(x) function to write a formula for  g(x) g(x) by evaluating  f(x−2). f(x−2).

f(x)= x 2 g(x)=f(x−2) g(x)=f(x−2)= (x−2) 2 f(x)= x 2 g(x)=f(x−2) g(x)=f(x−2)= (x−2) 2

#### Analysis 

To determine whether the shift is  +2 +2 or  −2 −2, consider a single reference point on the graph. For a quadratic, looking at the vertex point is convenient. In the original function,  f(0)=0. f(0)=0. In our shifted function,  g(2)=0. g(2)=0. To obtain the output value of 0 from the function  f, f, we need to decide whether a plus or a minus sign will work to satisfy  g(2)=f(x−2)=f(0)=0. g(2)=f(x−2)=f(0)=0. For this to work, we will need to _subtract_ 2 units from our input values.

###  Example  6

#### Interpreting Horizontal versus Vertical Shifts

The function  G(m) G(m) gives the number of gallons of gas required to drive  m m miles. Interpret  G(m)+10 G(m)+10 and  G(m+10). G(m+10).

####  Solution

G(m)+10 G(m)+10 can be interpreted as adding 10 to the output, gallons. This is the gas required to drive  m m miles, plus another 10 gallons of gas. The graph would indicate a vertical shift.

G(m+10) G(m+10) can be interpreted as adding 10 to the input, miles. So this is the number of gallons of gas required to drive 10 miles more than  m m miles. The graph would indicate a horizontal shift.

###  Try It  #2

Given the function  f(x)= x , f(x)= x , graph the original function  f(x) f(x) and the transformation  g(x)=f(x+2) g(x)=f(x+2) on the same axes. Is this a horizontal or a vertical shift? Which way is the graph shifted and by how many units?

####  Combining Vertical and Horizontal Shifts

Now that we have two transformations, we can combine them together. Vertical shifts are outside changes that affect the output (  y- y- ) axis values and shift the function up or down. Horizontal shifts are inside changes that affect the input (  x- x- ) axis values and shift the function left or right. Combining the two types of shifts will cause the graph of a function to shift up or down _and_ right or left.

###  How To

**Given a function and both a vertical and a horizontal shift, sketch the graph.**

  1. Identify the vertical and horizontal shifts from the formula.
  2. The vertical shift results from a constant added to the output. Move the graph up for a positive constant and down for a negative constant.
  3. The horizontal shift results from a constant added to the input. Move the graph left for a positive constant and right for a negative constant.
  4. Apply the shifts to the graph in either order.

###  Example  7

#### Graphing Combined Vertical and Horizontal Shifts

Given  f(x)=| x |, f(x)=| x |, sketch a graph of  h(x)=f(x+1)−3. h(x)=f(x+1)−3.

####  Solution

The function  f f is our toolkit absolute value function. We know that this graph has a V shape, with the point at the origin. The graph of  h h has transformed  f f in two ways:  f(x+1) f(x+1) is a change on the inside of the function, giving a horizontal shift left by 1, and the subtraction by 3 in  f(x+1)−3 f(x+1)−3 is a change to the outside of the function, giving a vertical shift down by 3. The transformation of the graph is illustrated in [Figure 9](<1-5-transformation-of-functions#Figure_01_05_010a>).

Let us follow one point of the graph of  f(x)=| x |. f(x)=| x |.

  * The point  (0,0) (0,0) is transformed first by shifting left 1 unit:  (0,0)→(−1,0) (0,0)→(−1,0)
  * The point  (−1,0) (−1,0) is transformed next by shifting down 3 units:  (−1,0)→(−1,−3) (−1,0)→(−1,−3)

![Graph of an absolute function, y=|x|, and how it was transformed to y=|x+1|-3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/26da718c5fc607cd74204f08386e0f2fe7f21599) Figure  9

[Figure 10](<1-5-transformation-of-functions#Figure_01_05_010b>) shows the graph of  h. h.

![The final function y=|x+1|-3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2d2d866da5b36e6d597c7dae0173f5b7273e1944) Figure  10

###  Try It  #3

Given  f(x)=| x |, f(x)=| x |, sketch a graph of  h(x)=f(x−2)+4. h(x)=f(x−2)+4.

###  Example  8

#### Identifying Combined Vertical and Horizontal Shifts

Write a formula for the graph shown in [Figure 11](<1-5-transformation-of-functions#Figure_01_05_012>), which is a transformation of the toolkit square root function.

![Graph of a square root function transposed right one unit and up 2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/96a30f3bd3672c407d9a9f95ff1b6de3bae45444) Figure  11

####  Solution

The graph of the toolkit function starts at the origin, so this graph has been shifted 1 to the right and up 2. In function notation, we could write that as 

h(x)=f(x−1)+2 h(x)=f(x−1)+2

Using the formula for the square root function, we can write

h(x)= x−1 +2 h(x)= x−1 +2

#### Analysis 

Note that this transformation has changed the domain and range of the function. This new graph has domain  [1,∞) [1,∞) and range  [2,∞). [2,∞).

###  Try It  #4

Write a formula for a transformation of the toolkit reciprocal function  f( x )= 1 x f( x )= 1 x that shifts the function’s graph one unit to the right and one unit up.

### Graphing Functions Using Reflections about the Axes

Another transformation that can be applied to a function is a reflection over the _x_ \- or _y_ -axis. A **vertical reflection** reflects a graph vertically across the _x_ -axis, while a **horizontal reflection** reflects a graph horizontally across the _y_ -axis. The reflections are shown in [Figure 12](<1-5-transformation-of-functions#Figure_01_05_013>).

![Graph of the vertical and horizontal reflection of a function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e09f94ae3474fae43f50dcc327456cc7213bbf24) Figure  12 Vertical and horizontal reflections of a function.

Notice that the vertical reflection produces a new graph that is a mirror image of the base or original graph about the _x_ -axis. The horizontal reflection produces a new graph that is a mirror image of the base or original graph about the _y_ -axis.

###  Reflections

Given a function  f(x), f(x), a new function  g(x)=−f(x) g(x)=−f(x) is a vertical reflection of the function  f(x), f(x), sometimes called a reflection about (or over, or through) the _x_ -axis.

Given a function  f(x), f(x), a new function  g(x)=f(−x) g(x)=f(−x) is a horizontal reflection of the function  f(x), f(x), sometimes called a reflection about the _y_ -axis.

###  How To

**Given a function, reflect the graph both vertically and horizontally.**

  1. Multiply all outputs by –1 for a vertical reflection. The new graph is a reflection of the original graph about the _x_ -axis.
  2. Multiply all inputs by –1 for a horizontal reflection. The new graph is a reflection of the original graph about the _y_ -axis.

###  Example  9

#### Reflecting a Graph Horizontally and Vertically

Reflect the graph of  s(t)= t s(t)= t (a) vertically and (b) horizontally. 

####  Solution

  1. ⓐ

Reflecting the graph vertically means that each output value will be reflected over the horizontal _t-_ axis as shown in [Figure 13](<1-5-transformation-of-functions#Figure_01_05_014>).

![Graph of the vertical reflection of the square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/453a5669988e633660ae9a3a8429a2cb553f1d64) Figure  13 Vertical reflection of the square root function

Because each output value is the opposite of the original output value, we can write

V(t)=−s(t) or V(t)=− t V(t)=−s(t) or V(t)=− t

Notice that this is an outside change, or vertical shift, that affects the output  s(t) s(t) values, so the negative sign belongs outside of the function.

  2. ⓑ

Reflecting horizontally means that each input value will be reflected over the vertical axis as shown in [Figure 14](<1-5-transformation-of-functions#Figure_01_05_015>).

![Graph of the horizontal reflection of the square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/48c4581abc0e4e1775f218d586bca73ade8aebdb) Figure  14 Horizontal reflection of the square root function

Because each input value is the opposite of the original input value, we can write

H(t)=s(−t) or H(t)= −t H(t)=s(−t) or H(t)= −t

Notice that this is an inside change or horizontal change that affects the input values, so the negative sign is on the inside of the function.

Note that these transformations can affect the domain and range of the functions. While the original square root function has domain  [0,∞) [0,∞) and range  [0,∞), [0,∞), the vertical reflection gives the  V(t) V(t) function the range  ( −∞,0 ] ( −∞,0 ] and the horizontal reflection gives the  H(t) H(t) function the domain  ( −∞,0 ]. ( −∞,0 ].

###  Try It  #5

Reflect the graph of  f(x)=|x−1| f(x)=|x−1| (a) vertically and (b) horizontally. 

###  Example  10

#### Reflecting a Tabular Function Horizontally and Vertically

A function  f(x) f(x) is given as [Table 6](<1-5-transformation-of-functions#Table_01_05_05>). Create a table for the functions below.

  1. ⓐ g(x)=−f(x) g(x)=−f(x)
  2. ⓑ h(x)=f(−x) h(x)=f(−x)

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x) f(x) ** | 1 | 3 | 7 | 11  
  
Table  6

####  Solution

  1. ⓐ

For  g(x), g(x), the negative sign outside the function indicates a vertical reflection, so the _x_ -values stay the same and each output value will be the opposite of the original output value. See [Table 7](<1-5-transformation-of-functions#Table_01_05_06>).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** g(x) g(x) ** | –1 | –3 | –7 | –11  
  
Table  7

  2. ⓑ

For  h(x), h(x), the negative sign inside the function indicates a horizontal reflection, so each input value will be the opposite of the original input value and the  h(x) h(x) values stay the same as the  f(x) f(x) values. See [Table 8](<1-5-transformation-of-functions#Table_01_05_07>).

** x x ** | −2 | −4 | −6 | −8  
---|---|---|---|---  
** h(x) h(x) ** | 1 | 3 | 7 | 11  
  
Table  8

###  Try It  #6

A function  f(x) f(x) is given as [Table 9](<1-5-transformation-of-functions#Table_01_05_08>). Create a table for the functions below.

  1. ⓐ g(x)=−f(x) g(x)=−f(x)
  2. ⓑ h(x)=f(−x) h(x)=f(−x)

** x x ** | −2 | 0 | 2 | 4  
---|---|---|---|---  
** f(x) f(x) ** | 5 | 10 | 15 | 20  
  
Table  9

###  Example  11

#### Applying a Learning Model Equation

A common model for learning has an equation similar to  k(t)=− 2 −t +1, k(t)=− 2 −t +1, where  k k is the percentage of mastery that can be achieved after  t t practice sessions. This is a transformation of the function  f(t)= 2 t f(t)= 2 t shown in [Figure 15](<1-5-transformation-of-functions#Figure_01_05_017>). Sketch a graph of  k(t). k(t).

![Graph of k\(t\)](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ee54fd1b8b681732d1331f8facd5ea10fab29620) Figure  15

####  Solution

This equation combines three transformations into one equation. 

  * A horizontal reflection:  f(−t)= 2 −t f(−t)= 2 −t
  * A vertical reflection:  −f(−t)=− 2 −t −f(−t)=− 2 −t
  * A vertical shift:  −f(−t)+1=− 2 −t +1 −f(−t)+1=− 2 −t +1

We can sketch a graph by applying these transformations one at a time to the original function. Let us follow two points through each of the three transformations. We will choose the points (0, 1) and (1, 2).

  1. First, we apply a horizontal reflection: (0, 1) (–1, 2).
  2. Then, we apply a vertical reflection: (0, −1) (-1, –2).
  3. Finally, we apply a vertical shift: (0, 0) (-1, -1).

This means that the original points, (0,1) and (1,2) become (0,0) and (-1,-1) after we apply the transformations.

In [Figure 16](<1-5-transformation-of-functions#Figure_01_05_018>), the first graph results from a horizontal reflection. The second results from a vertical reflection. The third results from a vertical shift up 1 unit.

![Graphs of all the transformations.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cc59f87061199ebfbcaa7bf53fa777ee66ef39cd) Figure  16

#### Analysis 

As a model for learning, this function would be limited to a domain of  t≥0, t≥0, with corresponding range  [0,1). [0,1).

###  Try It  #7

Given the toolkit function  f(x)= x 2 , f(x)= x 2 , graph  g(x)=−f(x) g(x)=−f(x) and  h(x)=f(−x). h(x)=f(−x). Take note of any surprising behavior for these functions. 

### Determining Even and Odd Functions

Some functions exhibit symmetry so that reflections result in the original graph. For example, horizontally reflecting the toolkit functions  f(x)= x 2 f(x)= x 2 or  f(x)=| x | f(x)=| x | will result in the original graph. We say that these types of graphs are symmetric about the _y_ -axis. Functions whose graphs are symmetric about the _y_ -axis are called **even functions.**

If the graphs of  f(x)= x 3 f(x)= x 3 or  f(x)= 1 x f(x)= 1 x were reflected over _both_ axes, the result would be the original graph, as shown in [Figure 17](<1-5-transformation-of-functions#Figure_01_05_022>).

![Graph of x^3 and its reflections.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/08cd8daa25344b76dd67cd3e83af0aa38b1e1ae4) Figure  17 (a) The cubic toolkit function (b) Horizontal reflection of the cubic toolkit function (c) Horizontal and vertical reflections reproduce the original cubic function. 

We say that these graphs are symmetric about the origin. A function with a graph that is symmetric about the origin is called an **odd function**.

Note: A function can be neither even nor odd if it does not exhibit either symmetry. For example,  f(x)= 2 x f(x)= 2 x is neither even nor odd. Also, the only function that is both even and odd is the constant function  f(x)=0. f(x)=0.

###  Even and Odd Functions

A function is called an even function if for every input  x x

f(x)=f(−x) f(x)=f(−x)

The graph of an even function is symmetric about the  y- y- axis.

A function is called an odd function if for every input  x x

f(x)=−f(−x) f(x)=−f(−x)

The graph of an odd function is symmetric about the origin.

###  How To

**Given the formula for a function, determine if the function is even, odd, or neither.**

  1. Determine whether the function satisfies  f(x)=f(−x). f(x)=f(−x). If it does, it is even.
  2. Determine whether the function satisfies  f(x)=−f(−x). f(x)=−f(−x). If it does, it is odd.
  3. If the function does not satisfy either rule, it is neither even nor odd.

###  Example  12

#### Determining whether a Function Is Even, Odd, or Neither 

Is the function  f(x)= x 3 +2x f(x)= x 3 +2x even, odd, or neither?

####  Solution

Without looking at a graph, we can determine whether the function is even or odd by finding formulas for the reflections and determining if they return us to the original function. Let’s begin with the rule for even functions.

f(−x)= (−x) 3 +2(−x)=− x 3 −2x f(−x)= (−x) 3 +2(−x)=− x 3 −2x

This does not return us to the original function, so this function is not even. We can now test the rule for odd functions.

−f(−x)=−( − x 3 −2x )= x 3 +2x −f(−x)=−( − x 3 −2x )= x 3 +2x

Because  −f(−x)=f(x), −f(−x)=f(x), this is an odd function.

#### Analysis 

Consider the graph of  f f in [Figure 18](<1-5-transformation-of-functions#Figure_01_05_039>). Notice that the graph is symmetric about the origin. For every point  ( x,y ) ( x,y ) on the graph, the corresponding point  ( −x,−y ) ( −x,−y ) is also on the graph. For example, (1, 3) is on the graph of  f, f, and the corresponding point  (−1,−3) (−1,−3) is also on the graph.

![Graph of f\(x\) with labeled points at \(1, 3\) and \(-1, -3\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cdda025b63fe8e61ed12453794486f0add56aa81) Figure  18

###  Try It  #8

Is the function  f(s)= s 4 +3 s 2 +7 f(s)= s 4 +3 s 2 +7 even, odd, or neither?

### Graphing Functions Using Stretches and Compressions

Adding a constant to the inputs or outputs of a function changed the position of a graph with respect to the axes, but it did not affect the shape of a graph. We now explore the effects of multiplying the inputs or outputs by some quantity.

We can transform the inside (input values) of a function or we can transform the outside (output values) of a function. Each change has a specific effect that can be seen graphically.

####  Vertical Stretches and Compressions 

When we multiply a function by a positive constant, we get a function whose graph is stretched or compressed vertically in relation to the graph of the original function. If the constant is greater than 1, we get a **vertical stretch** ; if the constant is between 0 and 1, we get a**vertical compression**. [Figure 19](<1-5-transformation-of-functions#Figure_01_05_025>) shows a function multiplied by constant factors 2 and 0.5 and the resulting vertical stretch and compression.

![Graph of a function that shows vertical stretching and compression.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c22d854a9c9d2de8d782ee5682150108d2b9d12d) Figure  19 Vertical stretch and compression

###  Vertical Stretches and Compressions

Given a function  f(x), f(x), a new function  g(x)=af(x), g(x)=af(x), where  a a is a constant, is a vertical stretch or vertical compression of the function  f(x). f(x).

  * If  a>1, a>1, then the graph will be stretched.
  * If  0<a<1, 0<a<1, then the graph will be compressed.
  * If  a<0, a<0, then there will be combination of a vertical stretch or compression with a vertical reflection.

###  How To

**Given a function, graph its vertical stretch.**

  1. Identify the value of  a. a.
  2. Multiply all range values by  a. a.
  3. If  a>1, a>1, the graph is stretched by a factor of  a. a.

If  0<a<1, 0<a<1, the graph is compressed by a factor of  a. a.

If  a<0, a<0, the graph is either stretched or compressed and also reflected about the _x_ -axis.

###  Example  13

#### Graphing a Vertical Stretch 

A function  P( t ) P( t ) models the population of fruit flies. The graph is shown in [Figure 20](<1-5-transformation-of-functions#Figure_01_05_026>).

![Graph to represent the growth of the population of fruit flies.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f8716b65b1de03b0912af730b5b410aba3586ee2) Figure  20

A scientist is comparing this population to another population,  Q, Q, whose growth follows the same pattern, but is twice as large. Sketch a graph of this population.

####  Solution

Because the population is always twice as large, the new population’s output values are always twice the original function’s output values. Graphically, this is shown in [Figure 21](<1-5-transformation-of-functions#Figure_01_05_027>).

If we choose four reference points, (0, 1), (3, 3), (6, 2) and (7, 0) we will multiply all of the outputs by 2.

The following shows where the new points for the new graph will be located.

( 0,1 )→( 0,2 ) ( 3,3 )→( 3,6 ) ( 6,2 )→( 6,4 ) ( 7,0 )→( 7,0 ) ( 0,1 )→( 0,2 ) ( 3,3 )→( 3,6 ) ( 6,2 )→( 6,4 ) ( 7,0 )→( 7,0 )

![Graph of the population function doubled.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4af1f4aad3843965b8640fb9ebeebc6580d34d82) Figure  21

Symbolically, the relationship is written as

Q(t)=2P(t) Q(t)=2P(t)

This means that for any input  t, t, the value of the function  Q Q is twice the value of the function  P. P. Notice that the effect on the graph is a vertical stretching of the graph, where every point doubles its distance from the horizontal axis. The input values,  t, t, stay the same while the output values are twice as large as before.

###  How To

**Given a tabular function and assuming that the transformation is a vertical stretch or compression, create a table for a vertical compression.**

  1. Determine the value of  a. a.
  2. Multiply all of the output values by  a. a.

###  Example  14

#### Finding a Vertical Compression of a Tabular Function

A function  f f is given as [Table 10](<1-5-transformation-of-functions#Table_01_05_09>). Create a table for the function  g(x)= 1 2 f(x). g(x)= 1 2 f(x).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x) f(x) ** | 1 | 3 | 7 | 11  
  
Table  10

####  Solution

The formula  g(x)= 1 2 f(x) g(x)= 1 2 f(x) tells us that the output values of  g g are half of the output values of  f f with the same inputs. For example, we know that  f(4)=3. f(4)=3. Then 

g(4)= 1 2 f(4)= 1 2 (3)= 3 2 g(4)= 1 2 f(4)= 1 2 (3)= 3 2

We do the same for the other values to produce [Table 11](<1-5-transformation-of-functions#Table_01_05_10>).

** x x ** |  2 2 |  4 4 |  6 6 |  8 8  
---|---|---|---|---  
** g(x) g(x) ** |  1 2 1 2 |  3 2 3 2 |  7 2 7 2 |  11 2 11 2  
  
Table  11

#### Analysis 

The result is that the function  g(x) g(x) has been compressed vertically by  1 2 . 1 2 . Each output value is divided in half, so the graph is half the original height.

###  Try It  #9

A function  f f is given as [Table 12](<1-5-transformation-of-functions#Table_01_05_011>). Create a table for the function  g(x)= 3 4 f(x). g(x)= 3 4 f(x).

x x | 2 | 4 | 6 | 8  
---|---|---|---|---  
f(x) f(x) | 12 | 16 | 20 | 0  
  
Table  12

###  Example  15

#### Recognizing a Vertical Stretch

The graph in [Figure 22](<1-5-transformation-of-functions#Figure_01_05_028>) is a transformation of the toolkit function  f(x)= x 3 . f(x)= x 3 . Relate this new function  g(x) g(x) to  f(x), f(x), and then find a formula for  g(x). g(x).

![Graph of a transformation of f\(x\)=x^3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cd35d28de2973a369bc03a5a3f1b3d133ad6c915) Figure  22

####  Solution

When trying to determine a vertical stretch or shift, it is helpful to look for a point on the graph that is relatively clear. In this graph, it appears that  g(2)=2. g(2)=2. With the basic cubic function at the same input,  f(2)= 2 3 =8. f(2)= 2 3 =8. Based on that, it appears that the outputs of  g g are  1 4 1 4 the outputs of the function  f f because  g(2)= 1 4 f(2). g(2)= 1 4 f(2). From this we can fairly safely conclude that  g(x)= 1 4 f(x). g(x)= 1 4 f(x).

We can write a formula for  g g by using the definition of the function  f. f.

g(x)= 1 4 f(x)= 1 4 x 3 g(x)= 1 4 f(x)= 1 4 x 3

###  Try It  #10

Write the formula for the function that we get when we stretch the identity toolkit function by a factor of 3, and then shift it down by 2 units.

####  Horizontal Stretches and Compressions 

Now we consider changes to the inside of a function. When we multiply a function’s input by a positive constant, we get a function whose graph is stretched or compressed horizontally in relation to the graph of the original function. If the constant is between 0 and 1, we get a **horizontal stretch** ; if the constant is greater than 1, we get a **horizontal compression** of the function.

![Graph of the vertical stretch and compression of x^2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8eecb53d65e9a87f0c7286b6d8cb90c2cad3a6e0) Figure  23

Given a function  y=f(x), y=f(x), the form  y=f(bx) y=f(bx) results in a horizontal stretch or compression. Consider the function  y= x 2 . y= x 2 . Observe [Figure 23](<1-5-transformation-of-functions#Figure_01_05_029>). The graph of  y= ( 0.5x ) 2 y= ( 0.5x ) 2 is a horizontal stretch of the graph of the function  y= x 2 y= x 2 by a factor of 2. The graph of  y= ( 2x ) 2 y= ( 2x ) 2 is a horizontal compression of the graph of the function  y= x 2 y= x 2 by a factor of 1212.

###  Horizontal Stretches and Compressions

Given a function  f(x), f(x), a new function  g(x)=f(bx), g(x)=f(bx), where  b b is a constant, is a horizontal stretch or horizontal compression of the function  f(x). f(x).

  * If  b>1, b>1, then the graph will be compressed by  1 b . 1 b .
  * If  0<b<1, 0<b<1, then the graph will be stretched by  1 b . 1 b .
  * If  b<0, b<0, then there will be combination of a horizontal stretch or compression with a horizontal reflection.

###  How To

**Given a description of a function, sketch a horizontal compression or stretch.**

  1. Write a formula to represent the function.
  2. Set  g(x)=f(bx) g(x)=f(bx) where  b>1 b>1 for a compression or  0<b<1 0<b<1 for a stretch.

###  Example  16

#### Graphing a Horizontal Compression 

Suppose a scientist is comparing a population of fruit flies to a population that progresses through its lifespan twice as fast as the original population. In other words, this new population,  R, R, will progress in 1 hour the same amount as the original population does in 2 hours, and in 2 hours, it will progress as much as the original population does in 4 hours. Sketch a graph of this population.

####  Solution

Symbolically, we could write

R(1)=P(2), R(2)=P(4), and in general, R(t)=P(2t). R(1)=P(2), R(2)=P(4), and in general, R(t)=P(2t).

See [Figure 24](<1-5-transformation-of-functions#Figure_01_05_030>) for a graphical comparison of the original population and the compressed population.

![Two side-by-side graphs. The first graph has function for original population whose domain is \[0,7\] and range is \[0,3\]. The maximum value occurs at \(3,3\). The second graph has the same shape as the first except it is half as wide. It is a graph of transformed population, with a domain of \[0, 3.5\] and a range of \[0,3\]. The maximum occurs at \(1.5, 3\). ](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d5958ef561d803922a3f671f067bb224dcf8fc6b) Figure  24 (a) Original population graph (b) Compressed population graph 

#### Analysis 

Note that the effect on the graph is a horizontal compression where all input values are half of their original distance from the vertical axis. 

###  Example  17

#### Finding a Horizontal Stretch for a Tabular Function

A function  f(x) f(x) is given as [Table 13](<1-5-transformation-of-functions#Table_01_05_12>). Create a table for the function  g(x)=f( 1 2 x ). g(x)=f( 1 2 x ).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(x) f(x) ** | 1 | 3 | 7 | 11  
  
Table  13

####  Solution

The formula  g(x)=f( 1 2 x ) g(x)=f( 1 2 x ) tells us that the output values for  g g are the same as the output values for the function  f f at an input half the size. Notice that we do not have enough information to determine  g(2) g(2) because  g(2)=f( 1 2 ⋅2 )=f(1), g(2)=f( 1 2 ⋅2 )=f(1), and we do not have a value for  f(1) f(1) in our table. Our input values to  g g will need to be twice as large to get inputs for  f f that we can evaluate. For example, we can determine  g(4). g(4).

g(4)=f( 1 2 ⋅4 )=f(2)=1 g(4)=f( 1 2 ⋅4 )=f(2)=1

We do the same for the other values to produce [Table 14](<1-5-transformation-of-functions#Table_01_05_13>).

** x x ** | 4 | 8 | 12 | 16  
---|---|---|---|---  
** g(x) g(x) ** | 1 | 3 | 7 | 11  
  
Table  14

[Figure 25](<1-5-transformation-of-functions#Figure_01_05_032>) shows the graphs of both of these sets of points.

![Graph of the previous table.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/58c949c0dab0e35de55ec4d947a438c50f800141) Figure  25

#### Analysis 

Because each input value has been doubled, the result is that the function  g(x) g(x) has been stretched horizontally by a factor of 2. 

###  Example  18

#### Recognizing a Horizontal Compression on a Graph

Relate the function  g(x) g(x) to  f(x) f(x) in [Figure 26](<1-5-transformation-of-functions#Figure_01_05_033>).

![Graph of f\(x\) being vertically compressed to g\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f0d293cbff7ec3ddb64bc9a74ef84796842be13e) Figure  26

####  Solution

The graph of  g(x) g(x) looks like the graph of  f(x) f(x) horizontally compressed. Because  f(x) f(x) ends at  (6,4) (6,4) and  g(x) g(x) ends at  (2,4), (2,4), we can see that the  x- x- values have been compressed by  1 3 , 1 3 , because  6( 1 3 )=2. 6( 1 3 )=2. We might also notice that  g(2)=f( 6 ) g(2)=f( 6 ) and  g(1)=f( 3 ). g(1)=f( 3 ). Either way, we can describe this relationship as  g(x)=f( 3x ). g(x)=f( 3x ). This is a horizontal compression by  1 3 . 1 3 .

#### Analysis 

Notice that the coefficient needed for a horizontal stretch or compression is the reciprocal of the stretch or compression. So to stretch the graph horizontally by a scale factor of 4, we need a coefficient of  1 4 1 4 in our function:  f( 1 4 x ). f( 1 4 x ). This means that the input values must be four times larger to produce the same result, requiring the input to be larger, causing the horizontal stretching.

###  Try It  #11

Write a formula for the toolkit square root function horizontally stretched by a factor of 3.

### Performing a Sequence of Transformations

When combining transformations, it is very important to consider the order of the transformations. For example, vertically shifting by 3 and then vertically stretching by 2 does not create the same graph as vertically stretching by 2 and then vertically shifting by 3, because when we shift first, both the original function and the shift get stretched, while only the original function gets stretched when we stretch first.

When we see an expression such as  2f(x)+3, 2f(x)+3, which transformation should we start with? The answer here follows nicely from the order of operations. Given the output value of  f(x), f(x), we first multiply by 2, causing the vertical stretch, and then add 3, causing the vertical shift. In other words, multiplication before addition.

Horizontal transformations are a little trickier to think about. When we write  g(x)=f(2x+3), g(x)=f(2x+3), for example, we have to think about how the inputs to the function  g g relate to the inputs to the function  f. f. Suppose we know  f(7)=12. f(7)=12. What input to  g g would produce that output? In other words, what value of  x x will allow  g(x)=f(2x+3)=12? g(x)=f(2x+3)=12? We would need  2x+3=7. 2x+3=7. To solve for  x, x, we would first subtract 3, resulting in a horizontal shift, and then divide by 2, causing a horizontal compression.

This format ends up being very difficult to work with, because it is usually much easier to horizontally stretch a graph before shifting. We can work around this by factoring inside the function.

f(bx+p)=f( b( x+ p b ) ) f(bx+p)=f( b( x+ p b ) )

Let’s work through an example.

f( x )= ( 2x+4 ) 2 f( x )= ( 2x+4 ) 2

We can factor out a 2.

f( x )= ( 2( x+2 ) ) 2 f( x )= ( 2( x+2 ) ) 2

Now we can more clearly observe a horizontal shift to the left 2 units and a horizontal compression. Factoring in this way allows us to horizontally stretch first and then shift horizontally.

###  Combining Transformations

When combining vertical transformations written in the form  af(x)+k, af(x)+k, first vertically stretch by  a a and then vertically shift by  k. k.

When combining horizontal transformations written in the form  f(bx-h), f(bx-h), first horizontally shift by  hb hb and then horizontally stretch by  1 b . 1 b .

When combining horizontal transformations written in the form  f(b(x-h)), f(b(x-h)), first horizontally stretch by  1 b 1 b and then horizontally shift by  h. h.

Horizontal and vertical transformations are independent. It does not matter whether horizontal or vertical transformations are performed first.

###  Example  19

#### Finding a Triple Transformation of a Tabular Function

Given [Table 15](<1-5-transformation-of-functions#Table_01_05_14>) for the function  f(x), f(x), create a table of values for the function  g(x)=2f(3x)+1. g(x)=2f(3x)+1.

** x x ** | 6 | 12 | 18 | 24  
---|---|---|---|---  
** f(x) f(x) ** | 10 | 14 | 15 | 17  
  
Table  15

####  Solution

There are three steps to this transformation, and we will work from the inside out. Starting with the horizontal transformations,  f(3x) f(3x) is a horizontal compression by  1 3 , 1 3 , which means we multiply each  x- x- value by  1 3 . 1 3 . See [Table 16](<1-5-transformation-of-functions#Table_01_05_15>).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** f(3x) f(3x) ** | 10 | 14 | 15 | 17  
  
Table  16

Looking now to the vertical transformations, we start with the vertical stretch, which will multiply the output values by 2. We apply this to the previous transformation. See [Table 17](<1-5-transformation-of-functions#Table_01_05_016>).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** 2f(3x) 2f(3x) ** | 20 | 28 | 30 | 34  
  
Table  17

Finally, we can apply the vertical shift, which will add 1 to all the output values. See [Table 18](<1-5-transformation-of-functions#Table_01_05_17>).

** x x ** | 2 | 4 | 6 | 8  
---|---|---|---|---  
** g(x)=2f(3x)+1 g(x)=2f(3x)+1 ** | 21 | 29 | 31 | 35  
  
Table  18

###  Example  20

#### Finding a Triple Transformation of a Graph

Use the graph of  f( x ) f( x ) in [Figure 27](<1-5-transformation-of-functions#Figure_01_05_035>) to sketch a graph of  k(x)=f( 1 2 x+1 )−3. k(x)=f( 1 2 x+1 )−3.

![Graph of a half-circle.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a5a3ac205fcc8bf1c67f026c1d0c6956d9ebb8ea) Figure  27

####  Solution

To simplify, let’s start by factoring out the inside of the function.

f( 1 2 x+1 )−3=f( 1 2 (x+2) )−3 f( 1 2 x+1 )−3=f( 1 2 (x+2) )−3

By factoring the inside, we can first horizontally stretch by 2, as indicated by the  1 2 1 2 on the inside of the function. Remember that twice the size of 0 is still 0, so the point (0,2) remains at (0,2) while the point (2,0) will stretch to (4,0). See [Figure 28](<1-5-transformation-of-functions#Figure_01_05_036>).

![Graph of a vertically stretch half-circle.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e52a35e10b12bfa715d468cf6d1931b69ccc60ae) Figure  28

Next, we horizontally shift left by 2 units, as indicated by  x+2. x+2. See [Figure 29](<1-5-transformation-of-functions#Figure_01_05_037>).

![Graph of a vertically stretch and translated half-circle.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b5724060d7db9beff541d5bd3a127e118f1c93f1) Figure  29

Last, we vertically shift down by 3 to complete our sketch, as indicated by the  −3 −3 on the outside of the function. See [Figure 30](<1-5-transformation-of-functions#Figure_01_05_038>).

![Graph of a vertically stretch and translated half-circle.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ccd5d7867f1d2b549d903456c30a38f25cb4675b) Figure  30

###  Media

Access this online resource for additional instruction and practice with transformation of functions.

  * [Function Transformations](<http://openstax.org/l/functrans>)

###  1.5 Section Exercises

#### Verbal

[1](<chapter-1>). 

When examining the formula of a function that is the result of multiple transformations, how can you tell a horizontal shift from a vertical shift?

2. 

When examining the formula of a function that is the result of multiple transformations, how can you tell a horizontal stretch from a vertical stretch?

[3](<chapter-1>). 

When examining the formula of a function that is the result of multiple transformations, how can you tell a horizontal compression from a vertical compression?

4. 

When examining the formula of a function that is the result of multiple transformations, how can you tell a reflection with respect to the _x_ -axis from a reflection with respect to the _y_ -axis?

[5](<chapter-1>). 

How can you determine whether a function is odd or even from the formula of the function?

#### Algebraic

6. 

Write a formula for the function obtained when the graph of  f(x)= x f(x)= x is shifted up 1 unit and to the left 2 units.

[7](<chapter-1>). 

Write a formula for the function obtained when the graph of  f(x)=| x | f(x)=| x | is shifted down 3 units and to the right 1 unit.

8. 

Write a formula for the function obtained when the graph of  f(x)= 1 x f(x)= 1 x is shifted down 4 units and to the right 3 units.

[9](<chapter-1>). 

Write a formula for the function obtained when the graph of  f(x)= 1 x 2 f(x)= 1 x 2 is shifted up 2 units and to the left 4 units.

For the following exercises, describe how the graph of the function is a transformation of the graph of the original function  f. f.

10. 

y=f(x−49) y=f(x−49)

[11](<chapter-1>). 

y=f(x+43) y=f(x+43)

12. 

y=f(x+3) y=f(x+3)

[13](<chapter-1>). 

y=f(x−4) y=f(x−4)

14. 

y=f(x)+5 y=f(x)+5

[15](<chapter-1>). 

y=f(x)+8 y=f(x)+8

16. 

y=f(x)−2 y=f(x)−2

[17](<chapter-1>). 

y=f(x)−7 y=f(x)−7

18. 

y=f(x−2)+3 y=f(x−2)+3

[19](<chapter-1>). 

y=f(x+4)−1 y=f(x+4)−1

For the following exercises, determine the interval(s) on which the function is increasing and decreasing.

20. 

f(x)=4 (x+1) 2 −5 f(x)=4 (x+1) 2 −5

[21](<chapter-1>). 

g(x)=5 (x+3) 2 −2 g(x)=5 (x+3) 2 −2

22. 

a(x)= −x+4 a(x)= −x+4

[23](<chapter-1>). 

k(x)=−3 x −1 k(x)=−3 x −1

#### Graphical

For the following exercises, use the graph of  f(x)= 2 x f(x)= 2 x shown in [Figure 31](<1-5-transformation-of-functions#Figure_01_05_201>) to sketch a graph of each transformation of  f(x). f(x).

![Graph of f\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/53e109db4bef6e385bc6a45d2e54bde0add6d55d) Figure  31

24. 

g(x)= 2 x +1 g(x)= 2 x +1

[25](<chapter-1>). 

h(x)= 2 x −3 h(x)= 2 x −3

26. 

w(x)= 2 x−1 w(x)= 2 x−1

For the following exercises, sketch a graph of the function as a transformation of the graph of one of the toolkit functions.

[27](<chapter-1>). 

f(t)= (t+1) 2 −3 f(t)= (t+1) 2 −3

28. 

h(x)=|x−1|+4 h(x)=|x−1|+4

[29](<chapter-1>). 

k(x)= (x−2) 3 −1 k(x)= (x−2) 3 −1

30. 

m(t)=3+ t+2 m(t)=3+ t+2

#### Numeric

[31](<chapter-1>). 

Tabular representations for the functions  f,g, f,g, and  h h are given below. Write  g(x) g(x) and  h(x) h(x) as transformations of  f(x). f(x).

** x x ** | −2 | −1 | 0 | 1 | 2  
---|---|---|---|---|---  
** f(x) f(x) ** | −2 | −1 | −3 | 1 | 2  
  
** x x ** | −1 | 0 | 1 | 2 | 3  
---|---|---|---|---|---  
** g(x) g(x) ** | −2 | −1 | −3 | 1 | 2  
  
** x x ** | −2 | −1 | 0 | 1 | 2  
---|---|---|---|---|---  
** h(x) h(x) ** | −1 | 0 | −2 | 2 | 3  
  
32. 

Tabular representations for the functions  f,g, f,g, and  h h are given below. Write  g(x) g(x) and  h(x) h(x) as transformations of  f(x). f(x).

** x x ** | −2 | −1 | 0 | 1 | 2  
---|---|---|---|---|---  
** f(x) f(x) ** | −1 | −3 | 4 | 2 | 1  
  
** x x ** | −3 | −2 | −1 | 0 | 1  
---|---|---|---|---|---  
** g(x) g(x) ** | −1 | −3 | 4 | 2 | 1  
  
** x x ** | −2 | −1 | 0 | 1 | 2  
---|---|---|---|---|---  
** h(x) h(x) ** | −2 | −4 | 3 | 1 | 0  
  
For the following exercises, write an equation for each graphed function by using transformations of the graphs of one of the toolkit functions.

[33](<chapter-1>). 

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e4960329e7c2799427b4e0d03878fafbde780bbe)

34. 

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/59c72082c6b02668d71c299b61493c7392daef03)

[35](<chapter-1>). 

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a076599190c90b216c082a4a4e63f9923ff1d623)

36. 

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/79a2640063715b2201fa607a9f6369eae4e31713)

[37](<chapter-1>). 

![Graph of a parabola](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fadaea57325cef987310151c6f0c36380621a76b)

38. 

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/807ba618fde69cdbf9c06270cd86fab64b3d0fdb)

[39](<chapter-1>). 

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/089aa2f667e68d504d79d616fb8646afc242cc7f)

40. 

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1e43aed6bbed22972f1f1dbdacfa4cecfcb25844)

For the following exercises, use the graphs of transformations of the square root function to find a formula for each of the functions.

[41](<chapter-1>). 

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0972b0182a82198cbbe88ba3d41b2f4384afb879)

42. 

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/39fb2067ae2b21a7c50f7d8f88a659f7ab3a4c90)

For the following exercises, use the graphs of the transformed toolkit functions to write a formula for each of the resulting functions.

[43](<chapter-1>). 

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/087bfeb2ad2967cb0bf4f742dba97ea34d39400f)

44. 

![Graph of a cubic function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/94c2563b5c6689701d2b0d3a5f3c7fe17e90921d)

[45](<chapter-1>). 

![Graph of a square root function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7111a940f42f69e1cb9027077e2fb22d3df27afe)

46. 

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0c5900083003f41bb33caf948a43f2aecefba55b)

For the following exercises, determine whether the function is odd, even, or neither.

[47](<chapter-1>). 

f(x)=3 x 4 f(x)=3 x 4

48. 

g(x)= x g(x)= x

[49](<chapter-1>). 

h(x)= 1 x +3x h(x)= 1 x +3x

50. 

f(x)= (x−2) 2 f(x)= (x−2) 2

[51](<chapter-1>). 

g(x)=2 x 4 g(x)=2 x 4

52. 

h(x)=2x− x 3 h(x)=2x− x 3

For the following exercises, describe how the graph of each function is a transformation of the graph of the original function  f. f.

[53](<chapter-1>). 

g(x)=−f(x) g(x)=−f(x)

54. 

g(x)=f(−x) g(x)=f(−x)

[55](<chapter-1>). 

g(x)=4f(x) g(x)=4f(x)

56. 

g(x)=6f(x) g(x)=6f(x)

[57](<chapter-1>). 

g(x)=f(5x) g(x)=f(5x)

58. 

g(x)=f(2x) g(x)=f(2x)

[59](<chapter-1>). 

g(x)=f( 1 3 x ) g(x)=f( 1 3 x )

60. 

g(x)=f( 1 5 x ) g(x)=f( 1 5 x )

[61](<chapter-1>). 

g(x)=3f( −x ) g(x)=3f( −x )

62. 

g(x)=−f(3x) g(x)=−f(3x)

For the following exercises, write a formula for the function  g g that results when the graph of a given toolkit function is transformed as described.

[63](<chapter-1>). 

The graph of  f(x)=|x| f(x)=|x| is reflected over the  y y _-_ axis and horizontally compressed by a factor of  1 4 1 4 .

64. 

The graph of  f(x)= x f(x)= x is reflected over the  x x-axis and horizontally stretched by a factor of 2.

[65](<chapter-1>). 

The graph of  f(x)= 1 x 2 f(x)= 1 x 2 is vertically compressed by a factor of  1 3 , 1 3 , then shifted to the left 2 units and down 3 units. 

66. 

The graph of  f(x)= 1 x f(x)= 1 x is vertically stretched by a factor of 8, then shifted to the right 4 units and up 2 units.

[67](<chapter-1>). 

The graph of  f(x)= x 2 f(x)= x 2 is vertically compressed by a factor of  1 2 , 1 2 , then shifted to the right 5 units and up 1 unit.

68. 

The graph of  f(x)= x 2 f(x)= x 2 is horizontally stretched by a factor of 3, then shifted to the left 4 units and down 3 units.

For the following exercises, describe how the formula is a transformation of a toolkit function. Then sketch a graph of the transformation.

[69](<chapter-1>). 

g(x)=4 (x+1) 2 −5 g(x)=4 (x+1) 2 −5

70. 

g(x)=5 (x+3) 2 −2 g(x)=5 (x+3) 2 −2

[71](<chapter-1>). 

h(x)=−2|x−4|+3 h(x)=−2|x−4|+3

72. 

k(x)=−3 x −1 k(x)=−3 x −1

[73](<chapter-1>). 

m(x)= 1 2 x 3 m(x)= 1 2 x 3

74. 

n(x)= 1 3 |x−2| n(x)= 1 3 |x−2|

[75](<chapter-1>). 

p( x )= ( 1 3 x ) 3 −3 p( x )= ( 1 3 x ) 3 −3

76. 

q( x )= ( 1 4 x ) 3 +1 q( x )= ( 1 4 x ) 3 +1

[77](<chapter-1>). 

a(x)= −x+4 a(x)= −x+4

For the following exercises, use the graph in [Figure 32](<1-5-transformation-of-functions#Figure_01_05_233>) to sketch the given transformations.

![Graph of a polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/89c25baa1c109586121a845fa075e0e767df0b38) Figure  32

78. 

g(x)=f(x)−2 g(x)=f(x)−2

[79](<chapter-1>). 

g(x)=−f(x) g(x)=−f(x)

80. 

g(x)=f(x+1) g(x)=f(x+1)

[81](<chapter-1>). 

g(x)=f(x−2) g(x)=f(x−2)


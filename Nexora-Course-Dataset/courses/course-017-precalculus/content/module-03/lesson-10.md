# 3.9 Modeling Using Variation

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/3-9-modeling-using-variation
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.9 Modeling Using Variation

### Learning Objectives

In this section, you will:

  * Solve direct variation problems.
  * Solve inverse variation problems.
  * Solve problems involving joint variation.

A used-car company has just offered their best candidate, Nicole, a position in sales. The position offers 16% commission on her sales. Her earnings depend on the amount of her sales. For instance, if she sells a vehicle for $4,600, she will earn $736. She wants to evaluate the offer, but she is not sure how. In this section, we will look at relationships, such as this one, between earnings, sales, and commission rate.

### Solving Direct Variation Problems

In the example above, Nicole’s earnings can be found by multiplying her sales by her commission. The formula  e=0.16s e=0.16s tells us her earnings,  e, e, come from the product of 0.16, her commission, and the sale price of the vehicle. If we create a table, we observe that as the sales price increases, the earnings increase as well, which should be intuitive. See [Table 1](<3-9-modeling-using-variation#Table_03_09_01>).

s s, sales prices |  e=0.16s e=0.16s | Interpretation   
---|---|---  
$4,600 |  e=0.16( 4,600 )=736 e=0.16( 4,600 )=736 | A sale of a $4,600 vehicle results in $736 earnings.  
$9,200 |  e=0.16( 9,200 )=1,472 e=0.16( 9,200 )=1,472 | A sale of a $9,200 vehicle results in $1472 earnings.  
$18,400 |  e=0.16( 18,400 )=2,944 e=0.16( 18,400 )=2,944 | A sale of a $18,400 vehicle results in $2944 earnings.  
  
Table  1

Notice that earnings are a multiple of sales. As sales increase, earnings increase in a predictable way. Double the sales of the vehicle from $4,600 to $9,200, and we double the earnings from $736 to $1,472. As the input increases, the output increases as a multiple of the input. A relationship in which one quantity is a constant multiplied by another quantity is called **direct variation**. Each variable in this type of relationship **varies directly** with the other.

[Figure 1](<3-9-modeling-using-variation#Figure_03_09_001>) represents the data for Nicole’s potential earnings. We say that earnings vary directly with the sales price of the car. The formula  y=k x n y=k x n is used for direct variation. The value  k k is a nonzero constant greater than zero and is called the **constant of variation**. In this case,  k=0.16 k=0.16 and  n=1. n=1.

![Graph of y=\(0.16\)x where the horizontal axis is labeled, “s, Sales Price in Dollars”, and the vertical axis is labeled, “e, Earnings, $”.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8bfb65f3c8025c36830c5246429f7688276ed66d) Figure  1

###  Direct Variation

If  xandy xandy are related by an equation of the form

y=k x n y=k x n

then we say that the relationship is direct variation and  y y varies directly with the  nth nth power of  x. x. In direct variation relationships, there is a nonzero constant ratio  k= y x n , k= y x n , where  k k is called the constant of variation, which help defines the relationship between the variables.

###  How To

**Given a description of a direct variation problem, solve for an unknown.**

  1. Identify the input,  x, x, and the output,  y. y.
  2. Determine the constant of variation. You may need to divide  y y by the specified power of  x x to determine the constant of variation.
  3. Use the constant of variation to write an equation for the relationship.
  4. Substitute known values into the equation to find the unknown.

###  Example  1

#### Solving a Direct Variation Problem

The quantity  y y varies directly with the cube of  x. x. If  y=25 y=25 when  x=2, x=2, find  y y when  x x is 6.

####  Solution

The general formula for direct variation with a cube is  y=k x 3 . y=k x 3 . The constant can be found by dividing  y y by the cube of  x. x.

k= y x 3 = 25 2 3 = 25 8 k= y x 3 = 25 2 3 = 25 8

Now use the constant to write an equation that represents this relationship.

y= 25 8 x 3 y= 25 8 x 3

Substitute  x=6 x=6 and solve for  y. y.

y= 25 8 (6) 3 =675 y= 25 8 (6) 3 =675

#### Analysis 

The graph of this equation is a simple cubic, as shown in [Figure 2](<3-9-modeling-using-variation#Figure_03_09_002>).

![Graph of y=25/8\(x^3\) with the labeled points \(2, 25\) and \(6, 675\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b4093a150bd577af57b691e9c4b951e271614aa9) Figure  2

###  Q&A

**Do the graphs of all direct variation equations look like[Example 1](<3-9-modeling-using-variation#Example_03_09_01>)?**

_No. Direct variation equations are power functions—they may be linear, quadratic, cubic, quartic, radical, etc. But all of the graphs pass through ( 0,0 ). ( 0,0 ). _

###  Try It  #1

The quantity  y y varies directly with the square of  x. x. If  y=24 y=24 when  x=3, x=3, find  y y when  x x is 4.

### Solving Inverse Variation Problems

Water temperature in an ocean varies inversely to the water’s depth. Between the depths of 250 feet and 500 feet, the formula  T= 14,000 d T= 14,000 d gives us the temperature in degrees Fahrenheit at a depth in feet below Earth’s surface. Consider the Atlantic Ocean, which covers 22% of Earth’s surface. At a certain location, at the depth of 500 feet, the temperature may be 28°F.

If we create [Table 2](<3-9-modeling-using-variation#Table_03_09_02>), we observe that, as the depth increases, the water temperature decreases.

d, d, depth |  T= 14,000 d T= 14,000 d | Interpretation   
---|---|---  
500 ft |  14,000 500 =28 14,000 500 =28 | At a depth of 500 ft, the water temperature is 28° F.  
350 ft |  14,000 350 =40 14,000 350 =40 | At a depth of 350 ft, the water temperature is 40° F.  
250 ft |  14,000 250 =56 14,000 250 =56 | At a depth of 250 ft, the water temperature is 56° F.  
  
Table  2

We notice in the relationship between these variables that, as one quantity increases, the other decreases. The two quantities are said to be **inversely proportional** and each term **varies inversely** with the other. Inversely proportional relationships are also called **inverse variations**.

For our example, [Figure 3](<3-9-modeling-using-variation#Figure_03_09_003>) depicts the inverse variation. We say the water temperature varies inversely with the depth of the water because, as the depth increases, the temperature decreases. The formula  y= k x y= k x for inverse variation in this case uses  k=14,000. k=14,000.

![Graph of y=\(14000\)/x where the horizontal axis is labeled, “Depth, d \(ft\)”, and the vertical axis is labeled, “Temperature, T \(Degrees Fahrenheit\)”.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0a3b8c9bfbd2767dded09ff38b5fbef2106672f7) Figure  3

###  Inverse Variation

If  x x and  y y are related by an equation of the form

y= k x n y= k x n

where  k k is a nonzero constant, then we say that  y y varies inversely with the  nth nth power of  x. x. In inversely proportional relationships, or inverse variations, there is a constant multiple  k= x n y. k= x n y.

###  Example  2

#### Writing a Formula for an Inversely Proportional Relationship

A tourist plans to drive 100 miles. Find a formula for the time the trip will take as a function of the speed the tourist drives.

####  Solution

Recall that multiplying speed by time gives distance. If we let  t t represent the drive time in hours, and  v v represent the velocity (speed or rate) at which the tourist drives, then  vt=distance. vt=distance. Because the distance is fixed at 100 miles,  vt=100. vt=100. Solving this relationship for the time gives us our function.

t(v)= 100 v =100 v −1 t(v)= 100 v =100 v −1

We can see that the constant of variation is 100 and, although we can write the relationship using the negative exponent, it is more common to see it written as a fraction.

###  How To

**Given a description of an indirect variation problem, solve for an unknown.**

  1. Identify the input,  x, x, and the output,  y. y.
  2. Determine the constant of variation. You may need to multiply  y y by the specified power of  x x to determine the constant of variation.
  3. Use the constant of variation to write an equation for the relationship.
  4. Substitute known values into the equation to find the unknown. 

###  Example  3

#### Solving an Inverse Variation Problem

A quantity  y y varies inversely with the cube of  x. x. If  y=25 y=25 when  x=2, x=2, find  y y when  x x is 6.

####  Solution

The general formula for inverse variation with a cube is  y= k x 3 . y= k x 3 . The constant can be found by multiplying  y y by the cube of  x. x.

k= x 3 y = 2 3 ⋅25 =200 k= x 3 y = 2 3 ⋅25 =200

Now we use the constant to write an equation that represents this relationship.

y= k x 3 ,k=200 y= 200 x 3 y= k x 3 ,k=200 y= 200 x 3

Substitute  x=6 x=6 and solve for  y. y.

y= 200 6 3 = 25 27 y= 200 6 3 = 25 27

#### Analysis 

The graph of this equation is a rational function, as shown in [Figure 4](<3-9-modeling-using-variation#Figure_03_09_004>). 

![Graph of y=25/\(x^3\) with the labeled points \(2, 25\) and \(6, 25/27\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/66fddde286812d980caabaca4f75faa30f86dd71) Figure  4

###  Try It  #2

A quantity  y y varies inversely with the square of  x. x. If  y=8 y=8 when  x=3, x=3, find  y y when  x x is 4.

### Solving Problems Involving Joint Variation

Many situations are more complicated than a basic direct variation or inverse variation model. One variable often depends on multiple other variables. When a variable is dependent on the product or quotient of two or more variables, this is called joint variation. For example, the cost of busing students for each school trip varies with the number of students attending and the distance from the school. The variable  c, c, cost, varies jointly with the number of students,  n, n, and the distance,  d. d.

###  Joint Variation

Joint variation occurs when a variable varies directly or inversely with multiple variables.

For instance, if  x x varies directly with both  y y and  z, z, we have  x=kyz. x=kyz. If  x x varies directly with  y y and inversely with  z, z, we have  x= ky z . x= ky z . Notice that we only use one constant in a joint variation equation.

###  Example  4

#### Solving Problems Involving Joint Variation

A quantity  x x varies directly with the square of  y y and inversely with the cube root of  z. z. If  x=6 x=6 when  y=2 y=2 and  z=8, z=8, find  x x when  y=1 y=1 and  z=27. z=27.

####  Solution

Begin by writing an equation to show the relationship between the variables.

x= k y 2 z 3 x= k y 2 z 3

Substitute  x=6, x=6, y=2, y=2, and  z=8 z=8 to find the value of the constant  k. k.

6= k 2 2 8 3 6= 4k 2 3=k 6= k 2 2 8 3 6= 4k 2 3=k

Now we can substitute the value of the constant into the equation for the relationship.

x= 3 y 2 z 3 x= 3 y 2 z 3

To find  x x when  y=1 y=1 and  z=27, z=27, we will substitute values for  y y and  z z into our equation.

x= 3 (1) 2 27 3 =1 x= 3 (1) 2 27 3 =1

###  Try It  #3

x x varies directly with the square of  y y and inversely with  z. z. If  x=40 x=40 when  y=4 y=4 and  z=2, z=2, find  x x when  y=10 y=10 and  z=25. z=25.

###  Media

Access these online resources for additional instruction and practice with direct and inverse variation.

  * [Direct Variation](<http://openstax.org/l/directvariation>)
  * [Inverse Variation](<http://openstax.org/l/inversevariatio>)
  * [Direct and Inverse Variation](<http://openstax.org/l/directinverse>)

###  3.9 Section Exercises

#### Verbal

[1](<chapter-3>). 

What is true of the appearance of graphs that reflect a direct variation between two variables?

2. 

If two variables vary inversely, what will an equation representing their relationship look like?

[3](<chapter-3>). 

Is there a limit to the number of variables that can jointly vary? Explain.

#### Algebraic

For the following exercises, write an equation describing the relationship of the given variables.

4. 

y y varies directly as  x x and when  x=6,y=12. x=6,y=12.

[5](<chapter-3>). 

y y varies directly as the square of  x x and when  x=4,y=80.  x=4,y=80. 

6. 

y y varies directly as the square root of  x x and when  x=36,y=24. x=36,y=24.

[7](<chapter-3>). 

y y varies directly as the cube of  x x and when  x=36,y=24. x=36,y=24.

8. 

y y varies directly as the cube root of  x x and when  x=27,y=15. x=27,y=15.

[9](<chapter-3>). 

y y varies directly as the fourth power of  x x and when  x=1,y=6. x=1,y=6.

10. 

y y varies inversely as  x x and when  x=4,y=2. x=4,y=2.

[11](<chapter-3>). 

y y varies inversely as the square of  x x and when  x=3,y=2. x=3,y=2.

12. 

y y varies inversely as the cube of  x x and when  x=2,y=5. x=2,y=5.

[13](<chapter-3>). 

y y varies inversely as the fourth power of  x x and when  x=3,y=1. x=3,y=1.

14. 

y y varies inversely as the square root of  x x and when  x=25,y=3. x=25,y=3.

[15](<chapter-3>). 

y y varies inversely as the cube root of  x x and when  x=64,y=5. x=64,y=5.

16. 

y y varies jointly with  x x and  z z and when  x=2 x=2 and z=3z=3, y=36. y=36.

[17](<chapter-3>). 

y y varies jointly as  x x, zz, and w w and when  x=1 x=1, z=2z=2, w=5w=5, then y=100. y=100.

18. 

y y varies jointly as the square of  x x and the square of  z z and when  x=3 x=3and  z=4z=4, then y=72. y=72.

[19](<chapter-3>). 

y y varies jointly as  x x and the square root of  z z and when  x=2 x=2 and z=25z=25, then y=100. y=100.

20. 

y y varies jointly as the square of  x x the cube of  z z and the square root of  w. w. When  x=1 x=1,z=2z=2, and w=36, then y=48. w=36, then y=48.

[21](<chapter-3>). 

y y varies jointly as  x xand z z and inversely as  w. w. When  x=3 x=3, z=5z=5, and w=6w=6, then y=10. y=10.

22. 

y y varies jointly as the square of  x x and the square root of  z z and inversely as the cube of  w.  w.  When  x=3,z=4, and w=3, then y=6. x=3,z=4, and w=3, then y=6.

[23](<chapter-3>). 

y y varies jointly as  x x and  z z and inversely as the square root of  w w and the square of  t . t . When  x=3 x=3, z=1,w=25z=1,w=25, and t=2t=2, then y=6. y=6.

#### Numeric

For the following exercises, use the given information to find the unknown value.

24. 

y y varies directly as  x x. When  x=3 x=3, then y=12y=12. Find yywhen x=20. x=20.

[25](<chapter-3>). 

y y varies directly as the square of  x x . When  x=2 x=2, then y=16y=16. Find yy when x=8 x=8. 

26. 

y y varies directly as the cube of  x x . When  x=3 x=3, then y=5y=5. Find yy when x=4 x=4. 

[27](<chapter-3>). 

y y varies directly as the square root of  x. x. When  x=16 x=16, then y=4y=4. Find y when x=36 y when x=36. 

28. 

y y varies directly as the cube root of  x. x. When  x=125 x=125, then y=15y=15. Find yy when x=1x=1, 000. 000.

[29](<chapter-3>). 

y y varies inversely with  x. x. When  x=3 x=3, then y=2y=2. Find yy when x=1 x=1. 

30. 

y y varies inversely with the square of  x x . When  x=4 x=4, then y=3y=3. Find yy when x=2 x=2. 

[31](<chapter-3>). 

y y varies inversely with the cube of  x. x. When  x=3 x=3, then y=1y=1. Find yy when x=1 x=1. 

32. 

y y varies inversely with the square root of  x. x. When  x=64, x=64, then  y=12. y=12. Find  y y when  x=36. x=36.

[33](<chapter-3>). 

y y varies inversely with the cube root of  x. x. When  x=27, x=27, then  y=5. y=5. Find  y y when  x=125. x=125.

34. 

y y varies jointly as  xandz. xandz. When  x=4 x=4 and  z=2, z=2, then  y=16. y=16. Find  y y when  x=3 x=3 and  z=3. z=3.

[35](<chapter-3>). 

y y varies jointly as  x,z,andw. x,z,andw. When  x=2, x=2, z=1, z=1, and  w=12, w=12, then  y=72. y=72. Find  y y when  x=1, x=1, z=2, z=2, and  w=3. w=3.

36. 

y y varies jointly as  x x and the square of  z. z. When  x=2 x=2 and  z=4, z=4, then  y=144. y=144. Find  y y when  x=4 x=4 and  z=5. z=5.

[37](<chapter-3>). 

y y varies jointly as the square of  x x and the square root of  z. z. When  x=2 x=2 and  z=9, z=9, then  y=24. y=24. Find  y y when  x=3 x=3 and  z=25. z=25.

38. 

y y varies jointly as  x x and  z z and inversely as  w. w. When  x=5, x=5, z=2, z=2, and  w=20, w=20, then  y=4. y=4. Find  y y when  x=3 x=3 and  z=8, z=8, and  w=48. w=48.

[39](<chapter-3>). 

y y varies jointly as the square of  x x and the cube of  z z and inversely as the square root of  w.  w.  When  x=2, x=2, z=2, z=2, and  w=64, w=64, then  y=12. y=12. Find  y y when  x=1, x=1, z=3, z=3, and  w=4. w=4.

40. 

y y varies jointly as the square of  x x and of  z z and inversely as the square root of  w w and of  t . t . When  x=2, x=2, z=3, z=3, w=16, w=16, and  t=3, t=3, then  y=1. y=1. Find  y y when  x=3, x=3, z=2, z=2, w=36, w=36, and  t=5. t=5.

#### Technology

For the following exercises, use a calculator to graph the equation implied by the given variation.

[41](<chapter-3>). 

y y varies directly with the square of  x x and when  x=2,y=3. x=2,y=3.

42. 

y y varies directly as the cube of  x x and when  x=2,y=4. x=2,y=4.

[43](<chapter-3>). 

y y varies directly as the square root of  x x and when  x=36,y=2. x=36,y=2.

44. 

y y varies inversely with  x x and when  x=6,y=2. x=6,y=2.

[45](<chapter-3>). 

y y varies inversely as the square of  x x and when  x=1,y=4. x=1,y=4.

####  Extensions

For the following exercises, use Kepler’s Law, which states that the square of the time,  T, T, required for a planet to orbit the Sun varies directly with the cube of the mean distance,  a, a, that the planet is from the Sun.

46. 

Using the Earth’s time of 1 year and mean distance of 93 million miles, find the equation relating  T T and  a. a.

[47](<chapter-3>). 

Use the result from the previous exercise to determine the time required for Mars to orbit the Sun if its mean distance is 142 million miles.

48. 

Using Earth’s distance of 150 million kilometers, find the equation relating  T T and  a. a.

[49](<chapter-3>). 

Use the result from the previous exercise to determine the time required for Venus to orbit the Sun if its mean distance is 108 million kilometers.

50. 

Using Earth’s distance of 1 astronomical unit (A.U.), determine the time for Saturn to orbit the Sun if its mean distance is 9.54 A.U.

####  Real-World Applications

For the following exercises, use the given information to answer the questions.

[51](<chapter-3>). 

The distance  s s that an object falls varies directly with the square of the time,  t, t, of the fall. If an object falls 16 feet in one se**c** ond, how long for it to fall 144 feet?

52. 

The velocity  v v of a falling object varies directly to the time,  t, t, of the fall. If after 2 seconds, the velocity of the object is 64 feet per second, what is the velocity after 5 seconds?

[53](<chapter-3>). 

The rate of vibration of a string under constant tension varies inversely with the length of the string. If a string is 24 inches long and vibrates 128 times per second, what is the length of a string that vibrates 64 times per second?

54. 

The volume of a gas held at constant temperature varies indirectly as the pressure of the gas. If the volume of a gas is 1200 cubic centimeters when the pressure is 200 millimeters of mercury, what is the volume when the pressure is 300 millimeters of mercury?

[55](<chapter-3>). 

The weight of an object above the surface of the Earth varies inversely with the square of the distance from the center of the Earth. If a body weighs 50 pounds when it is 3960 miles from Earth’s center, what would it weigh it were 3970 miles from Earth’s center?

56. 

The intensity of light measured in foot-candles varies inversely with the square of the distance from the light source. Suppose the intensity of a light bulb is 0.08 foot-candles at a distance of 3 meters. Find the intensity level at 8 meters.

[57](<chapter-3>). 

The current in a circuit varies inversely with its resistance measured in ohms. When the current in a circuit is 40 amperes, the resistance is 10 ohms. Find the current if the resistance is 12 ohms.

58. 

The force exerted by the wind on a plane surface varies jointly with the square of the velocity of the wind and with the area of the plane surface. If the area of the surface is 40 square feet surface and the wind velocity is 20 miles per hour, the resulting force is 15 pounds. Find the force on a surface of 65 square feet with a velocity of 30 miles per hour.

[59](<chapter-3>). 

The horsepower (hp) that a shaft can safely transmit varies jointly with its speed (in revolutions per minute (rpm)) and the cube of the diameter. If the shaft of a certain material 3 inches in diameter can transmit 45 hp at 100 rpm, what must the diameter be in order to transmit 60 hp at 150 rpm?

60. 

The kinetic energy  K K of a moving object varies jointly with its mass  m m and the square of its velocity  v. v. If an object weighing 40 kilograms with a velocity of 15 meters per second has a kinetic energy of 1000 joules, find the kinetic energy if the velocity is increased to 20 meters per second.


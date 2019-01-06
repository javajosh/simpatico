0 []
0 [1]
0 [1,2]
0 [1,2,3] #just a normal array push operation

0 [1,2,3]
1 []      # an explicit target creates a new branch (row)

1 []
1 [4]
1 [4,5]
1 [4,5,6]

0 [1,2,3]
1 [4,5,6]
2 []
2 [7]
2 [7,8]

0 [1,2,3]
1 [4,5,6]
2 [7,8]
1 [9]

Why bother with this representation? Wouldn't it be easier to implement with pointers?

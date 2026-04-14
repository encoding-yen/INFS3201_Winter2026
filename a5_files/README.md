Yyan Saguinsin
60306991

I have created 2 accounts student1 and student2, student1 has been purposefully
blocked to show the error in the login page. Use student2 to test the file
upload feature. Both accounts can upload files. There is already a file
upload for demonstration purposes.

===============================================================================
Accounts:
User       |     Password   |     Status
student1   |     pass       |     Locked
student2   |     infs       |     Open

===============================================================================
Main Changes:
- Created the 2 Factor Authentication with an error message.
- Created the file upload functions and features.
- Updated MongoDB to include the new fields like pendingToken (for 2FA login).
- Updated the the tiers to include 2FA and file upload
- Moved some of the functions into different layers to follow the proper 
3 tier architecture.
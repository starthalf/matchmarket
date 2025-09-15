```diff
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -169,7 +169,7 @@
             </View>
             <View style={styles.detailRow}>
               <Text style={styles.detailLabel}>경력</Text>
-              <Text style={styles.detailValue}>
-                {Math.floor(currentUser.experience / 12)}년 {currentUser.experience % 12}개월
+              <Text style={styles.detailValue}> 
+                {currentUser.experience}년
               </Text>
             </View>
             <View style={styles.detailRow}>
```
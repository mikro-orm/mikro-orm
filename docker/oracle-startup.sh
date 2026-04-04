sed -i "/# MikroORM start/,/# MikroORM end/d" /opt/oracle/product/26ai/dbhomeFree/network/admin/listener.ora
cat << EOF >> /opt/oracle/product/26ai/dbhomeFree/network/admin/listener.ora
# MikroORM start
SID_LIST_LISTENER =
  (SID_LIST =
    (SID_DESC =
      (GLOBAL_DBNAME = FREE)
      (ORACLE_HOME = /opt/oracle/product/26ai/dbhomeFree)
      (SID_NAME = FREE)
    )
    (SID_DESC =
      (GLOBAL_DBNAME = FREEPDB1)
      (ORACLE_HOME = /opt/oracle/product/26ai/dbhomeFree)
      (SID_NAME = FREE)
    )
  )
# MikroORM end

EOF
lsnrctl reload

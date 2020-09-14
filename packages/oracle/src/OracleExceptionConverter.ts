import {
  Dictionary, DeadlockException, LockWaitTimeoutException, TableExistsException, TableNotFoundException,
  ForeignKeyConstraintViolationException, UniqueConstraintViolationException, InvalidFieldNameException, NonUniqueFieldNameException,
  SyntaxErrorException, ConnectionException, NotNullConstraintViolationException, DriverException, ExceptionConverter, ReadOnlyException, DatabaseObjectNotFoundException,
} from '@mikro-orm/core';

export class OracleExceptionConverter extends ExceptionConverter {

  convertException(exception: Error & Dictionary): DriverException {

    // https://docs.oracle.com/cd/B28359_01/server.111/b28278/toc.htm
    switch (exception.errorNum) {
      case 1: // ORA-00001: unique constraint (string.string) violated
        return new UniqueConstraintViolationException(exception);
      case 54: // ORA-00054: resource busy and acquire with NOWAIT specified or timeout expired
        return new LockWaitTimeoutException(exception);
      case 18:    // ORA-00018: maximum number of sessions exceeded
      case 19:    // ORA-00019: maximum number of session licenses exceeded
      case 20:    // ORA-00020: maximum number of processes (string) exceeded
      case 22:    // ORA-00022: invalid session ID; access denied
      case 107:   // ORA-00107: failed to connect to ORACLE listener process
      case 1017:  // ORA-01017: invalid username/password; logon denied
      case 2010:  // ORA-02010: missing host connect string
      case 3113:  // ORA-03113: end-of-file on communication channel
      case 3135:  // ORA-03135: connection lost contact
      case 12154: // ORA-12154: TNS:could not resolve service name
      case 12198: // ORA-12198: TNS:could not find path to destination
      case 12203: // ORA-12203: TNS:unable to connect to destination
      case 12500: // ORA-12500: TNS:listener failed to start a dedicated server process
      case 12504: // ORA-12504: TNS:listener was not given the SERVICE_NAME in CONNECT_DATA
      case 12505: // ORA-12505: TNS:listener does not currently know of SID given in connect descriptor
      case 12511: // ORA-12511: TNS:service handler found but it is not accepting connections
      case 12513: // ORA-12513: TNS:service handler found but it has registered for a different protocol
      case 12514: // ORA-12514: TNS:listener does not currently know of service requested in connect descriptor
      case 12533: // ORA-12533: TNS:illegal ADDRESS parameters
      case 12545: // ORA-12545: TNS:name lookup failure
      case 12560: // ORA-12560: TNS:protocol adapter error
      case 12537:
        return new ConnectionException(exception);
      case 60: // ORA-00060: deadlock detected while waiting for resource
        return new DeadlockException(exception);
      case 904: // ORA-00904: invalid column name
        return new InvalidFieldNameException(exception);
      case 918: // ORA-00918: column ambiguously defined
      case 957: // ORA-00957: duplicate column name
      case 960: // ORA-00960: ambiguous column naming in select list
        return new NonUniqueFieldNameException(exception);
      case 900: // ORA-00900: invalid SQL statement
      case 901: // ORA-00901: invalid CREATE command
      case 902: // ORA-00902: invalid datatype
      case 905: // ORA-00905: missing keyword
      case 906: // ORA-00906: missing left parenthesis
      case 907: // ORA-00907: missing right parenthesis
      case 908: // ORA-00908: missing NULL keyword
      case 909: // ORA-00909: invalid number of arguments
      case 910: // ORA-00910: specified length too long for its datatype
      case 911: // ORA-00911: invalid character
      case 912: // ORA-00912: input parameter too long
      case 913: // ORA-00913: too many values
      case 914: // ORA-00914: missing ADD keyword
      case 917: // ORA-00917: missing comma
      case 919: // ORA-00919: invalid function
      case 920: // ORA-00920: invalid relational operator
      case 921: // ORA-00921: unexpected end of SQL command
      case 922: // ORA-00922: missing or invalid option
      case 923: // ORA-00923: FROM keyword not found where expected
      case 924: // ORA-00924: missing BY keyword
      case 925: // ORA-00925: missing INTO keyword
      case 926: // ORA-00926: missing VALUES keyword
      case 927: // ORA-00927: missing equal sign
      case 928: // ORA-00928: missing SELECT keyword
      case 929: // ORA-00929: missing period
      case 930: // ORA-00930: missing asterisk
      case 931: // ORA-00931: missing identifier
      case 932: // ORA-00932: inconsistent datatypes
      case 933: // ORA-00933: SQL command not properly ended
      case 934: // ORA-00934: group function is not allowed here
      case 935: // ORA-00935: group function is nested too deeply
      case 936: // ORA-00936: missing expression
      case 937: // ORA-00937: not a single-group group function
      case 938: // ORA-00938: not enough arguments for function
      case 939: // ORA-00939: too many arguments for function
      case 940: // ORA-00940: invalid ALTER command
      case 941: // ORA-00941: missing cluster name
      case 946: // ORA-00946: missing TO keyword
      case 947: // ORA-00947: not enough values
      case 950: // ORA-00950: invalid DROP option
      case 952: // ORA-00952: missing GROUP keyword
      case 954: // ORA-00954: missing IDENTIFIED keyword
      case 956: // ORA-00956: missing or invalid auditing option
      case 962: // ORA-00962: too many group-by or order-by expressions
      case 964: // ORA-00964: table name not in FROM list
      case 965: // ORA-00965: column aliases not allowed for "*"
      case 966: // ORA-00966: missing TABLE keyword
      case 967: // ORA-00967: missing WHERE keyword
      case 968: // ORA-00968: missing INDEX keyword
      case 969: // ORA-00969: missing ON keyword
      case 970: // ORA-00970: missing WITH keyword
      case 971: // ORA-00971: missing SET keyword
      case 972: // ORA-00972: identifier is too long
      case 974: // ORA-00974: invalid PCTFREE value percentage
      case 975: // ORA-00975: date + date not allowed
      case 976: // ORA-00976: LEVEL, PRIOR, or ROWNUM not allowed here
      case 977: // ORA-00977: duplicate auditing option
      case 978: // ORA-00978: nested group function without GROUP BY
      case 979: // ORA-00979: not a GROUP BY expression
      case 980: // ORA-00980: synonym translation is no longer valid
      case 981: // ORA-00981: cannot mix table and system auditing options
      case 982: // ORA-00982: missing plus sign
      case 984: // ORA-00984: column not allowed here
      case 985: // ORA-00985: invalid program name
      case 986: // ORA-00986: missing or invalid group names(s)
      case 987: // ORA-00987: missing or invalid username(s)
      case 988: // ORA-00988: missing or invalid password(s)
      case 989: // ORA-00989: too many passwords for usernames given
      case 990: // ORA-00990: missing or invalid privilege
      case 992: // ORA-00992: invalid format for REVOKE command
      case 993: // ORA-00993: missing GRANT keyword
      case 994: // ORA-00994: missing OPTION keyword
      case 995: // ORA-00995: missing or invalid synonym identifier
      case 996: // ORA-00996: the concatenate operator is ||, not |
      case 997: // ORA-00997: illegal use of LONG datatype
      case 998: // ORA-00998: must name this expression with a column alias
        return new SyntaxErrorException(exception);
      case 953: // ORA-00953: invalid index name
      case 999: // ORA-00999: invalid view name
        return new DatabaseObjectNotFoundException(exception);
      case 2291:
        return new ForeignKeyConstraintViolationException(exception);
      case 903: // ORA-00903: invalid table name
      case 942: // ORA-00942: table or view does not exist
      case 4063:
        return new TableNotFoundException(exception);
      case 955: // ORA-00955: name is already used by an existing object
        return new TableExistsException(exception);
      case 1400: // ORA-01400: cannot insert null into
        return new NotNullConstraintViolationException(exception);
      case 16000: // ORA-16000 Database open for read only access
        return new ReadOnlyException(exception);
    }

    return super.convertException(exception);
  }

}

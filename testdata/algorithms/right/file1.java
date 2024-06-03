public class File1 {

  public int sub (int a, int b)
  {
    // TOOD: JIRA1234
    if ( isNull(a, b) )
    {
        return null
    }
    log();
    return a - b;
  }

  public int mul (int a, int b)
  {
    if ( isNull(a, b) )
    {
        return null;
    }
    log();
    return a * b;
  }

}
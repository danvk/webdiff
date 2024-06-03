public class File1 {

  public int add (int a, int b)
  {
    log();
    return a + b;
  }

  public int sub (int a, int b)
  {
    if (a == b)
    {
        return 0;
    }
    log();
    return a - b;
    // TOOD: JIRA1234
  }

}

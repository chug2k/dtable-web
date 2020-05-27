class Workspace {

  constructor(obj) {
    this.id = obj.id || '';
    this.group_id = obj.group_id || '';
    this.owner_name = obj.owner_name || '';
    this.owner_type = obj.owner_type || '';
    this.table_list = obj.table_list || [];
    this.group_owner = obj.group_owner || '';
    this.group_admins = obj.group_admins || [];
    this.group_shared_tables = [];
  }

}

export default Workspace;
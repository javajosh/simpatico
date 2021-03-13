knossos.cli=> (pprint h)
[{:type :invoke, :f :write, :value 0, :process 0}
 {:type :ok, :f :write, :value 0, :process 0}
 {:type :invoke, :f :read, :value nil, :process 1}
 {:type :invoke, :f :write, :value 4, :process 2}
 {:type :ok, :f :read, :value 3, :process 1}
 {:type :ok, :f :write, :value 4, :process 2}
 {:type :invoke, :f :read, :value nil, :process 3}
 {:type :ok, :f :read, :value 4, :process 3}]

knossos.cli=> (def a (competition/analysis (model/cas-register) h))
{:configs ({:last-op {:f :write :index 1 :process 0 :type :ok :value 0}
            :model #knossos.model.CASRegister {:value 0}
            :pending [{:f :read :index 2 :process 1 :type :invoke :value 3}
                      {:f :write :index 3 :process 2 :type :invoke :value 4}]})
 :final-paths #{[{:model #knossos.model.CASRegister {:value 0}
                  :op {:f :write :index 1 :process 0 :type :ok :value 0}}
                 {:model #knossos.model.Inconsistent
                  {:msg "can't read 3 from register 0"}
                  :op {:f :read :index 4 :process 1 :type :ok :value 3}}]
                [{:model #knossos.model.CASRegister {:value 0}
                  :op {:f :write :index 1 :process 0 :type :ok :value 0}}
                 {:model #knossos.model.CASRegister {:value 4}
                  :op {:f :write :index 3 :process 2 :type :invoke :value 4}}
                 {:model #knossos.model.Inconsistent
                  {:msg "can't read 3 from register 4"}
                  :op {:f :read :index 4 :process 1 :type :ok :value 3}}]}
 :last-op {:f :write :index 1 :process 0 :type :ok :value 0}
 :op {:f :read :index 4 :process 1 :type :ok :value 3}
 :previous-ok {:f :write :index 1 :process 0 :type :ok :value 0}
 :valid? false}
